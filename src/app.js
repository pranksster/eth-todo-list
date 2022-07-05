App = {
    loading: false,
    contracts : {},

    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
          App.web3Provider = window.ethereum
          web3 = new Web3("http://127.0.0.1:8545")
        } else {
          window.alert("Please connect to Metamask.")
          web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
        }
        // Modern dapp browsers...
        if (window.ethereum) {
          window.web3 = new Web3(ethereum)
          try {
                // Request account access if needed
                const accounts = await ethereum.sendAsync('eth_requestAccounts');
                // Accounts now exposed, use them
                ethereum.send('eth_sendTransaction', { from: accounts[0], /* ... */ })
            } catch (error) {
                // User denied account access
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
          App.web3Provider = web3.currentProvider
          window.web3 = new Web3(web3.currentProvider)
          // Acccounts always exposed
          web3.eth.sendTransaction({/* ... */})
        }
        // Non-dapp browsers...
        else {
          console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
      },

  loadAccount: async () => {
    // var accounts
    web3.eth.getAccounts().then(function(acc){ App.account = acc[0] })
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const todolist = await $.getJSON('TODOList.json')
    App.contracts.TodoList = TruffleContract(todolist)
    App.contracts.TodoList.setProvider(App.web3Provider)

    //Hyderate the contracts with values from the blockchain
    App.todolist = await App.contracts.TodoList.deployed()
  },

  render: async () => {
    //Render account
    if (App.loading) {
        return
    }
    //Update App Loading State
    App.setLoading(true)

    console.log(App.account)
    $('#account').html(App.account)

    //render tasks
    await App.renderTasks()

    //Update App Loading State
    App.setLoading(false)
  },

  renderTasks: async () => {
    //Load total count from Block Chain
    const taskCount = await App.todolist.taskCount()
    const $taskTemplate = $('.taskTemplate')
    //Render out each task with a new task.temaplate
    for(var i = 1; i <= taskCount; i++) {
        const task = await App.todolist.tasks(i)
        const taskId = task[0].toNumber()
        const taskContent = task[1]
        const taskCompleted = task[2]

        //create the HTMl
        const $newTaskTemplate = $taskTemplate.clone()
        $newTaskTemplate.find('.content').html(taskContent)
        $newTaskTemplate.find('input')
                        .prop('name',taskId)
                        .prop('checked',taskCompleted)
                        .on('click', App.toggleCompleted)
        
        if(taskCompleted) {
            $('#completedTaskList').append($newTaskTemplate)
        } else {
            $('#taskList').append($newTaskTemplate)
        }

        //Show the task
        $newTaskTemplate.show()
    }
    
  },

  createTask: async () => {
    App.setLoading(true)
    const content = $('#newTask').val()
    await App.todolist.createTask(content, {from: App.account})
    window.location.reload()
  },

  toggleCompleted: async (e) => {
    App.setLoading(true)
    const taskId = e.target.name
    await App.todolist.toggleCompleted(taskId, {from: App.account})
    window.location.reload()
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
        loader.show()
        content.hide()
    } else {
        loader.hide()
        content.show()
    }
  }
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})