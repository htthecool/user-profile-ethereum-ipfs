// Import jquery
import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;

// Import bootstrap
import 'bootstrap';


// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.scss'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
//import metaCoinArtifact from '../../build/contracts/MetaCoin.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
//const MetaCoin = contract(metaCoinArtifact)

//import User contract artifact
import user_artifacts from "../../build/contracts/User.json"
let User = contract(user_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts
let account

//ipfs config
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('localhost','5001');
// const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});

const App = {
  start: function () {
    const self = this

    //ipfs config
    ipfs.id(function(err, res){
      if (err) throw err
      console.log("Connected to IPFS node!", res.agentVersion, res.protocolVersion);
    });

    // Bootstrap the MetaCoin abstraction for Use.
   // MetaCoin.setProvider(web3.currentProvider)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length === 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
        return
      }

      accounts = accs
      account = accounts[0]

      //set the provider for the User abstraction
      User.setProvider(web3.currentProvider);

      //show current address
      var ethAddressInput = $("#sign-up-eth-address").val(accounts[0]);

      //trigger create user when sign up is clicked
      var signUpButton = $("#sign-up-button").click(function() {
        self.createUser();
        return false;
      });
    //  self.refreshBalance()
      self.getUsers();
    });
  },

  createUser: function() {
    var username = $("#sign-up-username").val();
    var title = $("#sign-up-title").val();
    var intro = $("#sign-up-intro").val();
    var ipfsHash = "";

    console.log("creating user on ipfs for", username);

    let userJson = {
      username: username,
      title: title,
      intro: intro
    };

    ipfs.add([Buffer.from(JSON.stringify(userJson))], function(err, res){
      if (err) throw err
      ipfsHash = res[0].hash

      console.log("creating user on eth for", username, title, intro, ipfsHash);

      User.deployed().then(function(contractInstance) 
      {
        contractInstance.createUser(username, ipfsHash, {gas: 200000, from: web3.eth.accounts[0]}).then(function(success)
        {
          if(success) 
          {
            console.log("created user on ethereum!");
          }
          else
          {
            console.log("error creating user on ethereum");
          }
        }).catch(function(e) 
        {
          //There was an error! 
          console.log("error creating user:", username, ":", e);
        });
      }).catch(function(e) 
      {
        //There was an error! 
        console.log("error creating user:", username, ":", e);
      });
      
    });

    
  },

  getAUser: function(instance, i) {
    let instanceUsed = instance;
    let username;
    let ipfsHash;
    let address;
    let userCardId = "user-card-" + i;

    return instanceUsed.getUserByIndex.call(i).then(function(result)
    {
      /* */
      console.log("username:", username = web3.toAscii(result[1]),i);
      console.log("ipfsHash:", ipfsHash = web3.toAscii(result[2]),i);
      console.log("address:", address = result[0], i);
     
     // console.log(_address);
     
     /**/
      $("#" + userCardId).find(".card-title").text(username);
      $("#" + userCardId).find(".card-eth-address").text(address);
      
      if(ipfsHash != "not-available")
      {
        var url = "https://ipfs.io/ipfs/" + ipfsHash;
        console.log("getting user info from", url);

        $.getJSON(url, function(userJson){
          console.log("got user info from ipfs", userJson);
          $("#" + userCardId).find(".card-subtitle").text(userJson.title);
          $("#" + userCardId).find(".card-text").text(userJson.intro);
        });
      }

    }).catch(function(e){
      console.log("error getting user #",i, ":", e);
    });
  },

  getUsers: function() {
    var self = this;

    var instanceUsed;

    User.deployed().then(function(contractInstance){
      instanceUsed = contractInstance;

      return instanceUsed.getUserCount.call();
    }).then(function(userCount){
      userCount = userCount.toNumber();

      console.log("User count", userCount);

      let rowCount = 0;

      let usersDiv = $("#users-div");
      let currentRow;

      for(let i = 0; i < userCount; i++)
      {
        let userCardId = "user-card-" + i;

        if(i % 4 == 0) 
        {
          let currentRowId = "user-row-" + rowCount;
          let userRowTemplate = "<div class='row' id='" + currentRowId + "'></div>";
          usersDiv.append(userRowTemplate);
          currentRow = $("#" + currentRowId);
          rowCount++;
        }
        
        var userTemplate = "<div class='col-lg-3 mt-1 mb-1' id='" + userCardId + "'><div class='card bg-gradient-primary text-white card-profile p-1'><div class='card-body'><h5 class='card-title'></h5><h6 class='card-subtitle mb-2'></h6><p class='card-text'></p><p class='eth-address m-0 p-0'><span class='card-eth-address'></span></p></div></div></div>";

        currentRow.append(userTemplate);

      }

      console.log("getting users...");

      for(let i = 0; i < userCount; i++)
      {
        self.getAUser(instanceUsed, i);
      }
    });
  }
/*
  setStatus: function (message) {
    const status = document.getElementById('status')
    status.innerHTML = message
  },

  refreshBalance: function () {
    const self = this

    let meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.getBalance.call(account, { from: account })
    }).then(function (value) {
      const balanceElement = document.getElementById('balance')
      balanceElement.innerHTML = value.valueOf()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error getting balance; see log.')
    })
  },

  sendCoin: function () {
    const self = this

    const amount = parseInt(document.getElementById('amount').value)
    const receiver = document.getElementById('receiver').value

    this.setStatus('Initiating transaction... (please wait)')

    let meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.sendCoin(receiver, amount, { from: account })
    }).then(function () {
      self.setStatus('Transaction complete!')
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  }
  */
}

window.App = App

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to Metamask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
   // window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  }

  App.start()
})
