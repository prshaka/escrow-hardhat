import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child, update } from "firebase/database";
import firebaseConfig from './config';
import EscrowABI from './artifacts/contracts/Escrow.sol/Escrow.json';
const app = initializeApp(firebaseConfig);

function approveEscrow(escrow) {
  const db = getDatabase(app);
  update(ref(db, 'escrows/' + escrow.address), {
    approved: true
  });
}

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
  approveEscrow(escrowContract);
}



function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [upd, setUpd] = useState(true);

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  //setEscrows(escrows);

  function saveEscrow(escrow) {
    const db = getDatabase(app);
    set(ref(db, 'escrows/' + escrow.address), {
      address: escrow.address,
      arbiter: escrow.arbiter,
      beneficiary: escrow.beneficiary,
      value : escrow.value,
      approved: false
    });
    //setEscrows([...escrows, escrow])
    setUpd(true);
  }

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.BigNumber.from(ethers.utils.parseUnits(document.getElementById('eth').value,"ether"));
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value,
    };
    saveEscrow(escrow);
  }

  useEffect(() => {
    function getDB() {
      const dbRef = ref(getDatabase());
      get(child(dbRef, "escrows/")).then((snapshot) => {
        let res = [];
        snapshot.forEach(function(data) {
          let escrow = data.val();
          let escrowContract = new ethers.Contract(data.key,EscrowABI.abi,signer);
          res.push({
            address: data.key,
            arbiter: escrow.arbiter,
            beneficiary: escrow.beneficiary,
            value: ethers.utils.formatEther(escrow.value),
            approved: escrow.approved,
            handleApprove: async () => {
              escrowContract.on('Approved', () => {
                document.getElementById(data.key).className =
                  'complete';
                document.getElementById(data.key).innerText =
                  "✓ It's been approved!";
              });
      
              await approve(escrowContract, signer);
            },
          });
        });
        setEscrows(res);
        setUpd(false);
      });
    }
    if(upd) getDB();
  }, [signer,upd])

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Eth)
          <input type="text" id="eth" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
