 document.addEventListener('DOMContentLoaded', () => {

            const shippingTab = document.getElementById('shippingTab');
            const paymentTab = document.getElementById('paymentTab');
            const shippingContent = document.getElementById('shippingContent');
            const paymentContent = document.getElementById('paymentContent');

            shippingTab.addEventListener('click', () => {
                shippingContent.classList.remove('hidden')
                paymentContent.classList.add('hidden')
                shippingTab.classList.add('border-black', 'font-semibold')
                shippingTab.classList.remove('text-gray-500')
                paymentTab.classList.remove('border-black', 'font-semibold')
                paymentTab.classList.add('text-gray-500')
            })
            paymentTab.addEventListener('click', () => {
                paymentContent.classList.remove('hidden')
                shippingContent.classList.add('hidden')                
                paymentTab.classList.add('border-black', 'font-semibold')
                paymentTab.classList.remove('text-gray-500')
                shippingTab.classList.remove('border-black', 'font-semibold')
                shippingTab.classList.add('text-gray-500')
            })
            
            const addressRadios = document.querySelectorAll('input[name="address"]')
            const shippingSummary = document.getElementById('shippingSummary')
            function updateShippingSummary() {
                const selectedRadio = document.querySelector('input[name="address"]:checked')
                const selectedLabel = selectedRadio.closest('label')
                const detailsContainer = selectedLabel.querySelector('.address-details')
                if (detailsContainer) {
                    const name = detailsContainer.querySelector('.name').textContent
                    const line1 = detailsContainer.querySelector('.line1').textContent
                    const line2 = detailsContainer.querySelector('.line2').textContent
                    const postal = detailsContainer.querySelector('.postal').textContent
                    const contact = detailsContainer.querySelector('.contact').textContent   
                    shippingSummary.innerHTML = `
                        <p>${name}</p>
                        <p>${line1}</p>
                        <p>${line2}</p>
                        <p>${postal}</p>
                        <p>${contact}</p>
                    `;
                }                
                addressRadios.forEach(radio => {
                    const label = radio.closest('label')
                    if (radio.checked) {
                        label.classList.add('border-2', 'border-black', 'bg-gray-50')
                        label.classList.remove('border')
                    } else {
                        label.classList.remove('border-2', 'border-black', 'bg-gray-50')
                        label.classList.add('border')
                    }
                })
            }
            
            addressRadios.forEach(radio => {
                radio.addEventListener('change', updateShippingSummary)
            })
            
            updateShippingSummary()

            const orderNowBtn = document.getElementById('orderNowBtn')
            const orderModal = document.getElementById('orderModal')
            const closeModalBtn = document.getElementById('closeModalBtn')

            orderNowBtn.addEventListener('click', async (e) => {
            e.preventDefault()

            const selectedRadioBtnAddress = document.querySelector('input[name="address"]:checked')
            if (!selectedRadioBtnAddress) {
                return Swal.fire({
                    title: 'Error!',
                    text: 'Please select an address.', 
                    icon: 'error'
                })
            }
            const addressId = selectedRadioBtnAddress.value

            const selectedRadioBtnPayment = document.querySelector('input[name="payment_mode"]:checked');
            if (!selectedRadioBtnPayment) {
                return Swal.fire({
                    title: 'Error!',
                    text: 'Please select a payment mode.', 
                    icon: 'error'
                })
            }
            const paymentMethod = selectedRadioBtnPayment.value

            if(paymentMethod === 'COD'){
                checkOutCod(addressId,paymentMethod)
            }else if(paymentMethod === 'Razorpay'){
                checkOutRzp(addressId,paymentMethod)
            }else if(paymentMethod === 'Wallet'){
                checkOutWallet(addressId,paymentMethod)
            }

            async function checkOutWallet(addressId,paymentMethod) {
                try {
                     const response = await fetch('/orderwallet', {
                         method: "POST",
                         headers: { "Content-Type": "application/json" }, 

                         body: JSON.stringify({ addressId, paymentMethod }) 
                     })
                 
                     const result = await response.json()
                     console.log(result)
                 
                     if (response.ok) {
                         window.location.href = `/orderSuccess/${result.orderId}`
                     } else {
                         Swal.fire({
                             title: 'Order Failed!',
                             text: result.message || 'Something went wrong. Please try again.',
                             icon: 'error'
                         })
                     }
                 } catch (error) {
                     console.error('Error in checkOutWallet:', error)
                     Swal.fire({
                         title: 'Error!',
                         text: 'Could not connect to the server. Please try again.',
                         icon: 'error'
                     })
                 }

            }

            async function checkOutRzp(addressId, paymentMethod) {
                try {
                    const response = await fetch('/orderRzp', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paymentMethod, addressId })
                    })
                
                    const order = await response.json()
                    console.log(order)
                    const options = {
                        key: 'rzp_test_RcMfChaQ2P0zv3', 
                        amount: order.amount,
                        currency: order.currency,
                        name: "TimeCraft",
                        description: "Test Transaction",
                        order_id: order.id,
                        handler: async function (response) {
                            const verifyRes = await fetch("/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    response: response,  
                                    orderData: order,
                                    addressId:addressId, 
                                    paymentMethod:paymentMethod
                                })
                            })
                        
                            const result = await verifyRes.json()
                            if(result.success){
                            window.location.href=`/orderSuccess/${result.orderId}`
                            }else{

                                Swal.fire({
                                    title: result.success ? 'Success!' : 'Failed!',
                                    text: result.message,
                                    icon: result.success ? 'success' : 'error'
                                })
                            }
                        },
                        theme: {
                            color: "#0f0f0fff"
                        }
                    }
                
                    const rzp = new Razorpay(options)
                    rzp.on('payment.failed', async function(response){
                        console.log("payment failed",response.error)

                        const result = await fetch('/paymet_failed',
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                                orderData: order,
                                addressId:addressId, 
                                paymentMethod:paymentMethod
                            })
                        })
                        const resultId = await result.json() 
                        window.location.href= `/incompleteOrder/${resultId.orderId}`
                    })
                    rzp.open()
                
                } catch (error) {
                    console.error('Error placing order:', error)
                    Swal.fire({
                        title: 'Error!',
                        text: 'Could not connect to the server. Please check your connection.',
                        icon: 'error'
                    })
                }
            }

            async function checkOutCod(addressId,paymentMethod) {   
            try {
                const response = await fetch('/addOrder', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentMethod: paymentMethod, addressId: addressId })
                })

                const data = await response.json()
                
                if (response.ok) {
                        window.location.href = `/orderSuccess/${data.order._id}`
                } else {
                    
                    Swal.fire({
                        title: 'Order Failed!',
                        text: data.message || 'Something went wrong. Please try again.',
                        icon: 'error'
                    });
                }
            } catch (error) {
                console.error('Error placing order:', error)
                Swal.fire({
                    title: 'Error!',
                    text: 'Could not connect to the server. Please check your connection.',
                    icon: 'error'
                })
            }
        }
        })

            // closeModalBtn.addEventListener('click', () => {
            //     orderModal.classList.add('hidden')
            //     orderModal.classList.remove('flex')
            // })

            
            // orderModal.addEventListener('click', (e) => {
            //     if (e.target === orderModal) {
            //         orderModal.classList.add('hidden')
            //         orderModal.classList.remove('flex')
            //     }
            // })
        })

            document.getElementById('address').addEventListener('click',(e)=>{
                e.preventDefault()
                window.location.href='/checkoutAddaddress'
            })
