const addAmountBtn = document.querySelector('.addAmount')
    const amountInput = document.querySelector('.amountInput')
    const amountDisplay = document.querySelector('.amountArea')

    addAmountBtn.addEventListener('click', async () => {
        const amountToAddStr = amountInput.value.trim()

        const amount = parseFloat(amountToAddStr)
        
        console.log('Entered amount:', amount)

        if (!amount || amount <= 0 || isNaN(amount)) {
            Swal.fire({
                title: 'Invalid Amount',
                text: 'Please enter a valid amount to add to your wallet.',
                icon: 'warning'
            })
            return
        }

        try {
            const response = await fetch('/addWalletAmount', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amount }) 
            })

            const order = await response.json()
            console.log('Order created:', order)

            const options = {
                key: 'rzp_test_RcMfChaQ2P0zv3', 
                amount: order.amount,
                currency: order.currency,
                name: "TimeCraft",
                description: "Wallet Top-Up",
                order_id: order.id,
                handler: async function (response) {
                    const verifyRes = await fetch("/verifyWallet", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            response,
                            orderData: order
                        })
                    })
                    
                    const result = await verifyRes.json()
                    console.log(result)
                    if (result.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Amount added to your wallet successfully.',
                            icon: 'success'
                        }).then(() => {
                            
                            loadTransactions(1)
                            
                            const currentBalanceStr = amountDisplay.textContent.trim()
                            
                            const currentBalance = parseFloat(currentBalanceStr.replace(/[^\d.-]/g, ''))
                            
                            const newTotal = currentBalance + amount
                            
                            amountDisplay.textContent = `₹${newTotal.toFixed(2)}`
                            
                            amountInput.value = ""
                        })
                    } else {
                        Swal.fire({
                            title: 'Failed!',
                            text: result.message || 'Payment verification failed.',
                            icon: 'error'
                        })
                    }
                },
                theme: { color: "#3399cc" }
            }

            const rzp = new Razorpay(options)
            rzp.open()

        } catch (error) {
            console.error('Error:', error)
            Swal.fire({
                title: 'Error!',
                text: 'Could not connect to the server. Please try again.',
                icon: 'error'
            })
        }
    })