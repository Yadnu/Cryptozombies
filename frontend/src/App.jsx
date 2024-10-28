import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './App.css';
import cryptoZombiesABI from '../../cryptozombies_abi.js';

function App() {
  const [account, setAccount] = useState('');
  const [zombies, setZombies] = useState([]);
  const [txStatus, setTxStatus] = useState('');
  const [zombieName, setZombieName] = useState('');
  const [cryptoZombies, setCryptoZombies] = useState(null);

  // Load Web3, account, and contract
  useEffect(() => {
    async function loadWeb3() {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
  
          const cryptoZombiesAddress = "0x759ab4267Bb57e2685dbCd1ea33FB15b85bf53B2"; // Replace with your contract address
          const contract = new web3.eth.Contract(cryptoZombiesABI, cryptoZombiesAddress);
          setCryptoZombies(contract);
  
          // Set up event listener for Transfer events
          contract.events.Transfer({ filter: { _to: accounts[0] } })
            .on("data", function (event) {
              console.log("Transfer event detected", event);
              getZombiesByOwner(accounts[0]);
            })
            .on("error", console.error);
        } catch (error) {
          console.error("Error loading web3", error);
        }
      } else {
        alert("Please install MetaMask to use this app!");
      }
    }
    loadWeb3();
  }, []); // Run once on component mount
  

  // Function to get zombie details
  const getZombieDetails = async (id) => {
    console.log("Fetching zombie details for ID:", id);
    const zombie = await cryptoZombies.methods.zombies(id).call();
    console.log("Zombie details:", zombie);
    return zombie;
  };

  // Function to get zombies by owner
  const getZombiesByOwner = async (owner) => {
    try {
      console.log("Fetching zombies for owner:", owner);
      const ids = await cryptoZombies.methods.getZombiesByOwner(owner).call();
      console.log("Zombie IDs for owner:", ids);
      const zombieDetails = await Promise.all(ids.map((id) => getZombieDetails(id)));
      setZombies(zombieDetails);
      console.log("Zombie details fetched:", zombieDetails);
    } catch (error) {
      console.error("Error fetching zombies by owner", error);
    }
  };

  // Create a zombie
  const createZombie = async () => {
    if (!zombieName) {
      alert("Please enter a zombie name");
      return;
    }
    setTxStatus("Creating new zombie on the blockchain...");
    try {
      await cryptoZombies.methods.createRandomZombie(zombieName)
        .send({ from: account });
      setTxStatus(`Successfully created zombie: ${zombieName}`);
      getZombiesByOwner(account); // Refresh the list of zombies
    } catch (error) {
      console.error("Error creating zombie", error);
      setTxStatus("Failed to create zombie");
    }
  };

  // Level up a zombie
  const levelUpZombie = async (zombieId) => {
    setTxStatus("Leveling up your zombie...");
    try {
      await cryptoZombies.methods.levelUp(zombieId)
        .send({ from: account, value: Web3.utils.toWei("0.001", "ether") });
      setTxStatus("Zombie leveled up!");
      getZombiesByOwner(account); // Refresh the list of zombies
    } catch (error) {
      console.error("Error leveling up zombie", error);
      setTxStatus("Failed to level up zombie");
    }
  };

  return (
    <div className="App">
      <h1>CryptoZombies Frontend</h1>
      <p>Your Account: {account}</p>
      <p>Status: {txStatus}</p>

      <input
        type="text"
        placeholder="Enter zombie name"
        value={zombieName}
        onChange={(e) => setZombieName(e.target.value)}
      />
      <button onClick={createZombie}>Create Zombie</button>

      <h2>Your Zombies</h2>
      <div>
        {zombies.length === 0 && <p>No zombies found</p>}
        {zombies.map((zombie, index) => (
          <div key={index} className="zombie">
            <ul>
              <li>Name: {zombie.name}</li>
              <li>DNA: {zombie.dna}</li>
              <li>Level: {zombie.level}</li>
              <li>Wins: {zombie.winCount}</li>
              <li>Losses: {zombie.lossCount}</li>
              <li>Ready Time: {new Date(zombie.readyTime * 1000).toLocaleString()}</li>
            </ul>
            <button onClick={() => levelUpZombie(index)}>Level Up</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
