document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('input[type="search"]')
    const filterSelect = document.querySelector('select')
    const ordersContainer = document.getElementById('ordersContainer')
    const paginationContainer = document.getElementById('paginationContainer')


    let debounceTimer

    const fetchOrders = async () => {
        const query = searchInput.value.trim()
        const filter = filterSelect.value

        const params = new URLSearchParams()
        if (query) params.append('search', query)
        if (filter && filter !== 'all') params.append('filter', filter)
        
        params.append('page', 1)

        try {
            const res = await fetch(`/account/orders?${params.toString()}`, {
                headers: { "Accept": "application/json" }
            })

            if (!res.ok) throw new Error('Request failed')

            const data = await res.json()
            renderOrders(data.orderData)
            renderPagination(data.totalPages, data.currentPage)


        } catch (err) {
            console.error('Fetch error:', err)
            ordersContainer.innerHTML = `<p class="text-center text-red-500 py-10">Failed to load orders.</p>`
        }
    }

    const handleSearchInput = () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(fetchOrders, 400)
    }

    const renderOrders = (orders) => {
        ordersContainer.innerHTML = ''

        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = `<p class="text-center text-gray-500 py-10">No orders found.</p>`
            paginationContainer.style.display = 'none'
            return
        }

        const htmlContent = orders.map(order => generateOrderHTML(order)).join('')
        ordersContainer.innerHTML = htmlContent
        
        attachActionListeners()
    }

    const generateOrderHTML = (order) => {
        let statusColor = "bg-gray-400"
        let statusTextColor = "text-gray-800"
        if (order.status === "Pending") { statusColor = "bg-yellow-400"; statusTextColor = "text-yellow-800"; }
        if (order.status === "Shipped") { statusColor = "bg-blue-400"; statusTextColor = "text-blue-800"; }
        if (order.status === "Delivered") { statusColor = "bg-green-400"; statusTextColor = "text-green-800"; }
        if (order.status === "Cancelled") { statusColor = "bg-red-400"; statusTextColor = "text-red-800"; }

        const orderDate = new Date(order.order_date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        })

        const firstItem = order.items[0]
        const product = firstItem.product_id
        const variantIndex = firstItem.variant

        const imageUrl = product.variants && product.variants[variantIndex] 
                         ? product.variants[variantIndex].image_url[0] 
                         : '/images/placeholder.jpg'
        const productName = product.name || 'Product Unavailable'

        let paymentStatusHTML = '';
        if (order.status !== 'Returned' && order.status !== 'Cancelled' && order.status !== 'Delivered') {
            paymentStatusHTML = `
                <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-opacity-20 self-start">
                    <p>Payment Status</p>
                    <span class="w-2.5 h-2.5 rounded-full ${statusColor}"></span>
                    <p class="font-bold text-sm">${order.payment_status}</p>
                </div>`;
        }

        let actionButtonsHTML = ''
        

        if (order.status !== 'Returned' && order.status !== 'Cancelled' && order.status !== 'Delivered' && order.payment_status !== 'Failed') {
            actionButtonsHTML += `
                <button class="text-sm w-full sm:w-auto font-bold bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-900 transition duration-300 shadow-sm cancel-btn" data-id="${order._id}">
                    Cancel
                </button>`;
        }

        if (order.payment_status === 'Failed' && order.status !== 'Cancelled') {
            actionButtonsHTML += `
                <button class="text-sm w-full sm:w-auto font-bold bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-900 transition duration-300 shadow-sm retry-btn" data-id="${order._id}">
                    Retry Payment
                </button>`;
        }
        actionButtonsHTML += `
            <button class="text-sm w-full sm:w-auto font-bold bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-600 transition duration-300 shadow-sm"
                onclick="window.location.href='/order-details/${order._id}'">
                View Details
            </button>`;

        return `
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 transition hover:shadow-md mb-6">
                <div class="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div class="w-full h-32 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                        <img src="${imageUrl}" width="150px" height="150px" alt="${productName}" class="object-contain w-full h-full">
                    </div>

                    <div class="flex-grow flex flex-col justify-between w-full">
                        <div>
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2">
                                <div>
                                    <p class="text-sm text-gray-500">Order ID</p>
                                    <h3 class="font-bold text-lg text-gray-900">#${order.order_id}</h3>
                                </div>
                                <p class="text-sm text-gray-500 mt-2 sm:mt-0 sm:self-start">${orderDate}</p>
                                ${paymentStatusHTML}
                            </div>
                            
                            <div class="mt-3">
                                <h4 class="font-semibold text-gray-900 truncate" title="${productName}">${productName}</h4>
                                ${order.items.length > 1 ? `<p class="text-xs text-gray-500 mt-1">+ ${order.items.length - 1} more item(s)</p>` : ''}
                                
                                <div class="flex justify-between items-center mt-3">
                                    <span class="text-gray-600 font-medium">Total Amount</span>
                                    <span class="font-bold text-lg text-gray-900">₹ ${order.total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 px-3 py-1 rounded-full ${statusColor} ${statusTextColor} bg-opacity-20 self-start mt-4">
                            <span class="w-2.5 h-2.5 rounded-full ${statusColor}"></span>
                            <p class="font-bold text-sm">${order.status}</p>
                        </div>

                        <div class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                            ${actionButtonsHTML}
                        </div>
                    </div>
                </div>
            </div>`
    }

    const attachActionListeners = () => {
        const cancelBtns = document.querySelectorAll('.cancel-btn')
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault()
                const orderId = e.currentTarget.dataset.id

                Swal.fire({
                    title: 'Are you sure?',
                    text: "This will cancel the order.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ff3d3d',
                    cancelButtonColor: '#a5a5a5',
                    confirmButtonText: 'Yes, cancel!'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const response = await fetch('/cancel_order', {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderId: orderId })
                            })
                            const data = await response.json()
                            if (data.success) {
                                Swal.fire('Cancelled!', 'Order canceled successfully', 'success')
                                    .then(() => {
                                        fetchOrders()
                                    })
                            } else {
                                Swal.fire('Error', data.message || 'Could not cancel order', 'error')
                            }
                        } catch (err) {
                            console.log(err)
                            Swal.fire('Error', 'Something went wrong', 'error')
                        }
                    }
                })
            })
        })

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
    }
       function fetchOrdersPage(page) {
        const query = searchInput.value.trim()
        const filter = filterSelect.value

        const params = new URLSearchParams()

        if (query) params.append('search', query)
        if (filter && filter !== 'all') params.append('filter', filter)

        params.append('page', page)

        fetch(`/account/orders?${params.toString()}`, {
            headers: { "Accept": "application/json" }
        })
        .then(res => res.json())
        .then(data => {
            renderOrders(data.orderData);
            renderPagination(data.totalPages, data.currentPage);
        })
        .catch(err => {
            console.error(err);
            ordersContainer.innerHTML = `<p class="text-center text-red-500 py-10">Failed to load orders.</p>`;
        })
    }

    const renderPagination = (totalPages, currentPage) => {
        if (!totalPages || totalPages <= 1) {
            paginationContainer.style.display = "none"
            return
        }

        paginationContainer.style.display = "flex"

        let html = ""
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button 
                    class="px-3 py-1 border rounded ${currentPage === i ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}"
                    data-page="${i}">
                    ${i}
                </button>`
        }

        paginationContainer.innerHTML = html
    }

    if (paginationContainer) {
        paginationContainer.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-page]")
            if (!btn) return

            const page = btn.dataset.page
            if (!page) return

            fetchOrdersPage(page)
        })
    }
    searchInput.addEventListener('input', handleSearchInput)
    filterSelect.addEventListener('change', fetchOrders)

    attachActionListeners()
})