 if(userData && userData._id) {
    const socket = new WebSocket('ws://localhost:5000')
    socket.onopen = () => {
      console.log('WebSocket connection established.')
      socket.send(JSON.stringify({
        event: 'user_in_login',
        userId: userData._id
      }))
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.event) {
        window.location.href = '/'
      }
    }
    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
    socket.onclose = () => {
      console.log('WebSocket connection closed.')
    }
  }

  const socket = new WebSocket('ws://localhost:5000')

  socket.onopen=()=>{
            console.log('WebSocket connection established.')
            socket.send(JSON.stringify({
                event: 'viewing_home'
            }))
        }
           socket.onmessage = (event)=>{
            const data = JSON.parse(event.data)

            if(data.event === 'product_blocked'){
                window.location.href = '/'
            }
           } 