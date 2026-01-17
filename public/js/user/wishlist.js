 document.querySelectorAll('#remove-btn').forEach((btn)=>{
            btn.addEventListener('click',async(e)=>{
                e.preventDefault()
                const wishlistId = e.currentTarget.dataset.id
                try {
                    const response = await fetch(`/removeWishlist/${wishlistId}`,{method:"DELETE"})
                    if (response.ok){
                  Swal.fire({
                    title: 'Removed!',
                    text: 'Wishlist has been removed.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                  })
                  document.getElementById(`${wishlistId}`).remove()
                  window.updateCartCount();
                }else{
                    Swal.fire({ title: 'Error!', text: 'Failed to remove form wishlist.', icon: 'error' })
                }
                } catch (error) {
                    Swal.fire('Error', 'Something went wrong', 'error')
                }

            })
        })

document.querySelectorAll('#addCartbtn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    const productId = e.currentTarget.dataset.id
    const variant = e.currentTarget.dataset.variant
    const btnId = e.currentTarget.dataset.btnid

    if (!productId) return
    try {
      const response = await fetch('/addCart', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variant: Number(variant),
          quantity: 1
        })
      })
      const data = await response.json()
      if (response.ok) {
        Swal.fire({
          title: "Added to Cart 🛒",
          text: data.message || "Item successfully added to your cart!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        })
        window.updateCartCount();
        document.getElementById(btnId)?.remove()
      } else {
        Swal.fire({
          title: "Error!",
          text: data.message || "Failed to add item to cart.",
          icon: "error"
        })
      }

    } catch (error) {
      console.error("Error adding to cart:", error)
      Swal.fire("Error", "Something went wrong while adding to cart", "error")
    }
  })
})

const socket = new WebSocket('ws://localhost:5000')

  socket.onopen=()=>{
            console.log('WebSocket connection established.')
            socket.send(JSON.stringify({
                event: 'viewing_wishlist'
            }))
        }
           socket.onmessage = (event)=>{
            const data = JSON.parse(event.data)

            if(data.event === 'product_blocked'){
                window.location.href = '/wishlist'
            }
           } 