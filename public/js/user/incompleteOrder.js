const retryBtns = document.querySelectorAll('.retry-btn')
        retryBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault()
                const originalOrderId = e.currentTarget.dataset.id

                try {
                    const response = await fetch('/retryPayment', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: originalOrderId })
                    })

                    if (!response.ok) throw new Error('Failed to create retry order')

                    const order = await response.json()
                    const options = {
                        key: 'rzp_test_RcMfChaQ2P0zv3', 
                        amount: order.orderData.amount,
                        currency: order.orderData.currency,
                        name: "TimeCraft",
                        description: "Retry Transaction",
                        order_id: order.orderData.id,
                        handler: async function (handlerResponse) {
                            const verifyRes = await fetch("/retryverify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    response: handlerResponse,
                                    orderId: originalOrderId
                                })
                            })
                            const result = await verifyRes.json()
                            if (result.success) {
                                window.location.href = `/orderSuccess/${result.orderId}`
                            } else {
                                Swal.fire('Failed!', result.message, 'error')
                            }
                        },
                        theme: { color: "#3399cc" }
                    }

                    const rzp = new Razorpay(options)
                    rzp.on('payment.failed', function (failResponse) {
                        console.log("payment failed", failResponse.error)
                        Swal.fire('Payment Failed', 'The retry attempt failed.', 'error')
                    })
                    rzp.open()

                } catch (err) {
                    console.error(err)
                    Swal.fire('Error!', 'Could not initiate payment retry. Please try again.', 'error')
                }
            })
        })