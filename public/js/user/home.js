 if(userData && userData._id) {
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host = window.location.host;
  const socket = new WebSocket(`${protocol}${host}`);
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

  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host = window.location.host;
  const socket = new WebSocket(`${protocol}${host}`);

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