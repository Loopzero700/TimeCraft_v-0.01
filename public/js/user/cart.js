document.addEventListener('DOMContentLoaded',()=>{
    if(couponCode){
        couponapply(true)
    }
}) 

 const productItems = document.querySelectorAll('.product-item')
            const formatCurrency = (amount) =>{
                return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount).replace('₹', '₹')
            }
            const updateItemTotal = (item)=>{
                const priceElement = item.querySelector('.price')
                const quantityInput = item.querySelector('.quantity')
                const totalPriceElement = item.querySelector('.total-price')
                const price = parseFloat(priceElement.dataset.price)
                const quantity = parseInt(quantityInput.value)
                const total = price * quantity
                totalPriceElement.textContent = formatCurrency(total)
                updateOrderSummary()
            }
            const updateOrderSummary=()=>{
                let subtotal = 0
                document.querySelectorAll('.product-item').forEach(item => {
                    const price = parseFloat(item.querySelector('.price').dataset.price)
                    const quantity = parseInt(item.querySelector('.quantity').value)
                    subtotal += price * quantity
                })
                document.getElementById('subtotal').textContent = formatCurrency(subtotal)
                document.getElementById('grand-total').textContent = formatCurrency(subtotal)
            }

            //add debounce to the btn of plus and minus
           function debounce(fn, delay = 300) {
              let timer
              return (...args) => {
                clearTimeout(timer)
                timer = setTimeout(() => fn(...args), delay)
              }
            }

            productItems.forEach(item => {
            
              const minusBtn = item.querySelector('.minus-btn')
              const plusBtn = item.querySelector('.plus-btn')
              const quantityInput = item.querySelector('.quantity')
            
              const cartId = minusBtn.dataset.id
              const stock = parseInt(plusBtn.dataset.stock)
            
    
              const debouncedUpdateQuantity = debounce(async (type, newQty) => {
                const url = type === "inc"
                  ? `/cart/inquabtity/${cartId}`
                  : `/cart/dequabtity/${cartId}`
            
                const response = await fetch(url, { method: "PATCH" })
            
                if (response.ok) {
                  couponapply(false)
                  updateItemTotal(item)
                } else {
                  console.log("failed to update quantity")
                }
              }, 350)
          
              minusBtn.addEventListener('click', (e) => {
                let quantity = parseInt(quantityInput.value)
            
                if (quantity > 1) {
                  quantityInput.value = quantity - 1
                  debouncedUpdateQuantity("dec", quantity - 1)
                }
              })
          
              plusBtn.addEventListener('click', (e) => {
                let quantity = parseInt(quantityInput.value)
            
                if (quantity < stock && quantity < 5) {
                  quantityInput.value = quantity + 1
                
                  debouncedUpdateQuantity("inc", quantity + 1)
                }
              })
          
            })

            updateOrderSummary()
        

        document.querySelectorAll('#removebtn').forEach((btn)=>{
            btn.addEventListener('click',async(e)=>{
                e.preventDefault()
                const cartId = e.currentTarget.dataset.id
                try {
                    const response= await fetch(`/cart/delete/${cartId}`, { method: "DELETE" })
                    if (response.ok){
              Swal.fire({
                title: 'Removed!',
                text: 'cart has been removed.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              })
              document.getElementById(cartId)?.remove()
              setTimeout(() => {
                  let subtotal = 0
                  document.querySelectorAll('.product-item').forEach(item => {
                      const price = parseFloat(item.querySelector('.price').dataset.price)
                      const quantity = parseInt(item.querySelector('.quantity').value)
                      subtotal += price * quantity
                    })
                    couponapply(false)
                document.getElementById('subtotal').textContent = `₹${subtotal}`
                document.getElementById('grand-total').textContent = `₹${subtotal}`
                },300)
            } else {
              Swal.fire({ title: 'Error!', text: 'Failed to remove cart.', icon: 'error' })
            }
                } catch (error) {
                    console.log(error)
                    Swal.fire('Error', 'Something went wrong', 'error')
                }

            })
        })

        document.getElementById('checkoutBtn').addEventListener('click', async (e) => {
            e.preventDefault();
        
            try {
                const response = await fetch('/validate-stock', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
            
                const data = await response.json();
            
                if (data.success) {
                    
                    window.location.href = '/checkout';
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Out of Stock',
                        text: data.message,
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error checking stock:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Something went wrong. Please try again.'
                });
            }
        });

        let appliedCoupon = null
        let discountAmount = 0
        let subtotal = 0

            document.getElementById("applyCouponBtn").addEventListener("click", async () => { couponapply(true) })
        
            const couponapply = async(apply)=> {

            const code = document.getElementById("couponInput").value.trim().toUpperCase()
            const msg = document.getElementById("couponMessage")
            const applyBtn = document.getElementById("applyCouponBtn")
                
            if (!code) {
                if(apply){
                    msg.textContent = "Please enter a coupon code."
                    msg.className = "text-red-600 text-sm mt-2"
                    }
                return
            }
        
            try {
                const response = await fetch('/apply_coupon', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code })
                })
            
                const result = await response.json()
            
                if (!result.success) {
                    msg.textContent = result.message || "Invalid coupon."
                    msg.className = "text-red-600 text-sm mt-2"
                    return
                }
            
                discountAmount = result.discount
                const newGrandTotal = result.grandTotal
                appliedCoupon = code
            
                document.getElementById("discountRow").classList.remove("hidden")
                document.getElementById("discountAmount").textContent = `- ₹${discountAmount}`
                document.getElementById("grand-total").textContent = `₹${newGrandTotal}`
            
                applyBtn.disabled = true
                applyBtn.classList.add("bg-gray-400", "cursor-not-allowed")
                msg.textContent = result.message
                msg.className = "text-green-600 text-sm mt-2"
                
                document.getElementById("removeCouponBtn").classList.remove("hidden")

            } catch (error) {
                console.error(error)
                msg.textContent = "Something went wrong. Please try again."
                msg.className = "text-red-600 text-sm mt-2"
            }
            }
        

            document.getElementById("removeCouponBtn").addEventListener("click", async () => {
                try {
                    const response = await fetch('/remove_coupon', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    })                
                    const result = await response.json()
                
                    if (result.success) {
                        appliedCoupon = null
                        discountAmount = 0
                        couponCode = null

                        document.getElementById("discountRow").classList.add("hidden")
                        document.getElementById("discountAmount").textContent = "- ₹0"
                        document.getElementById("applyCouponBtn").disabled = false
                        document.getElementById("applyCouponBtn").classList.remove("bg-gray-400", "cursor-not-allowed")

                        document.getElementById("couponInput").value = ""
                        document.getElementById("couponMessage").textContent = ""
                        document.getElementById("removeCouponBtn").classList.add("hidden")
                    
                        updateOrderSummary()
                    }
                } catch (error) {
                    console.error("Error removing coupon:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Failed to remove coupon. Please try again.'
                    })
                }
            })