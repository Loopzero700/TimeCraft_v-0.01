 document.addEventListener("DOMContentLoaded",()=>{
        fetchAndRenderOrders()
    })
  
    function debounce(func, delay = 350) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args)
            }, delay)
        }
    }

    const ordersContainer = document.querySelector('#orders-tbody')
    const searchInput = document.querySelector('[name="search"]')
    const paginationContainer = document.querySelector('.pagination')
    const statusFilter = document.querySelector('#status-filter')
    const sortFilter = document.querySelector('#sort-filter')
    const controlsForm = document.querySelector('#controls-form')
    async function fetchAndRenderOrders(page = 1) {
        const search = searchInput.value.trim()
        const status = statusFilter.value
        const sort = sortFilter.value
        const url = new URL('/admin/orders/search', window.location.origin)
        url.searchParams.set('search', search)
        url.searchParams.set('status', status)
        url.searchParams.set('sort', sort)
        url.searchParams.set('page', page)
        
        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error('Fetch request failed')
            const response = await res.json()
            renderOrderRows(response.data)
            renderPagination(response.totalPages, response.currentPage)

        } catch (err) {
            console.error('Fetch failed:', err)
            ordersContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-red-500 py-10">
                        Failed to load results.
                    </td>
                </tr>`;
            paginationContainer.innerHTML = ''
        }
    }

    function renderOrderRows(data) {
        ordersContainer.innerHTML = ''; 
        if (data.length === 0) {
            ordersContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-10">
                        No orders found.
                    </td>
                </tr>`;
            return;
        }
        data.forEach(order => {
            if(order.payment_status!=='Failed'){
            const statusColor = order.status === 'Delivered' ? 'text-green-400' :
                                order.status === 'Cancelled' ? 'text-red-400' :
                                order.status === 'Returned' ? 'text-yellow-400' :
                                'text-blue-400';
            const addressLine1 = [order.address_name, order.address_state, order.address_country].filter(Boolean).join(', ');
            const addressLine2 = [order.address_pincode, order.address_phone_number].filter(Boolean).join(', ');
            
            const orderRowHTML = `
                <tr>
                    <td class="p-4 text-white font-medium">#${order.order_id}</td>
                    <td class="p-4 text-white">${addressLine1}<br>${addressLine2}</td>
                    <td class="p-4 text-gray-300">${order.payment_method}</td>
                    <td class="p-4 font-semibold ${statusColor}">${order.status}</td>
                    <td class="p-4 text-white">₹${order.total}</td>
                    <td class="p-4">
                        <button class="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-4 rounded-md transition-colors" data-id="${order._id}">
                            More Details
                        </button>
                    </td>
                </tr>
            `;
            ordersContainer.insertAdjacentHTML('beforeend', orderRowHTML)
        }
        })
    }
    
    function renderPagination(totalPages, currentPage) {
        paginationContainer.innerHTML = ''
        if (totalPages <= 1) return

        let paginationHTML = '';
        
        if (currentPage > 1) {
         
            paginationHTML += `<a href="#" data-page="${currentPage - 1}">Previous</a>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <a href="#" 
                   data-page="${i}" 
                   class="${i === currentPage ? 'active' : ''}">
                   ${i}
                </a>`;
        }
        if (currentPage < totalPages) {
            paginationHTML += `<a href="#" data-page="${currentPage + 1}">Next</a>`;
        }
        
        paginationContainer.innerHTML = paginationHTML
    }

    if (controlsForm) {
        controlsForm.addEventListener('submit', (e) => e.preventDefault())
    }
    
    if (searchInput) {
        
        searchInput.addEventListener('input', debounce(() => {
            fetchAndRenderOrders(1)
        }, 350))
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            fetchAndRenderOrders(1)
        })
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            fetchAndRenderOrders(1)
        })
    }
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault()
                
            const link = e.target.closest('a[data-page]')
            
            if (link) {
                const page = parseInt(link.dataset.page, 10);
                fetchAndRenderOrders(page)
            }
        })
    }
    if (ordersContainer) {
        ordersContainer.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-id]')
            if (button) {
                const orderId = button.dataset.id;
                window.location.href = `/admin/orderDetails/${orderId}`
            }
        })
    }