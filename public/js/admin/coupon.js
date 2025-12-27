 const searchInput = document.getElementById('searchInput')
    const tableBody = document.getElementById('tableBody')
    const paginationContainer = document.getElementById('pagination')
    

    function debounce(func, delay) {
      let timer
      return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => func(...args), delay)
      }
    }
    async function fetchCoupons(page = 1) {
      const query = searchInput.value.trim()
      const url = `/admin/coupon?page=${page}&search=${encodeURIComponent(query)}&json=true&limit=${currentPageLimit}`
      
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Network response was not ok')
        const result = await response.json()
        
        currentPageLimit = result.limit
        updateTable(result.data, result.currentPage, result.limit)
        updatePagination(result)
      } catch (err) {
        console.error('Error fetching coupons:', err);
        tableBody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-400">Error loading data.</td></tr>`;
      }
    }

    const handleSearch = debounce(() => {
      fetchCoupons(1)
    }, 500)


    function updateTable(coupons, currentPage, limit) {
      tableBody.innerHTML = ''
      if (!coupons.length) {
        tableBody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-400">No coupons found.</td></tr>`
        return
      }

      coupons.forEach((coupon, index) => {
        const expiryDate = new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' })
        const serialNumber = (currentPage - 1) * limit + index + 1
        const discount = coupon.discountType === 'percentage' ? `${coupon.discountAmount}%` : `₹${coupon.discountAmount}`
        const minPurchase = coupon.minPurchase ? `₹${coupon.minPurchase}` : 'N/A';
        
        const statusClass = coupon.status === 'active' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
        const toggleBtnClass = coupon.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        const toggleBtnText = coupon.status === 'active' ? 'Deactivate' : 'Activate'

        const row = `
          <tr id="couponRow-${coupon._id}" class="hover:bg-gray-800 transition-all">
            <td class="p-4 text-white font-medium">${serialNumber}</td>
            <td class="p-4 text-white font-medium uppercase">${coupon.code}</td>
            <td class="p-4 text-gray-300 capitalize">${coupon.discountType}</td>
            <td class="p-4 text-gray-300">${discount}</td>
            <td class="p-4 text-gray-300">${minPurchase}</td>
            <td class="p-4 text-gray-300">${expiryDate}</td>
            <td class="p-4">
              <span class="status-badge px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClass}">
                ${coupon.status}
              </span>
            </td>
            <td class="p-4 flex gap-2">
              <button data-id="${coupon._id}" class="edit-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded-md transition-colors">Edit</button>
              <button 
                data-id="${coupon._id}" 
                data-status="${coupon.status}"
                class="toggle-status-btn text-white font-medium py-1 px-4 rounded-md transition-colors ${toggleBtnClass}">
                ${toggleBtnText}
              </button>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row)
      })

      addEditRemoveButtonListeners()
    }
    function updatePagination(result) {
      const { totalPages, currentPage, search } = result;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      let html = ''

      if (totalPages > 1) {
        if (currentPage > 1) {
          html += `<a href="/admin/coupon?page=${currentPage - 1}${searchParam}" class="no-underline text-custom-gray px-[14px] py-[8px] rounded-md bg-custom-dark-1 border border-custom-dark-2 text-[0.9rem] transition-all duration-300 hover:bg-custom-dark-2 hover:text-custom-light">Previous</a>`;
        }
        for (let i = 1; i <= totalPages; i++) {
          const activeClass = (i === currentPage)
            ? 'bg-custom-orange text-white border-custom-orange'
            : 'text-custom-gray bg-custom-dark-1 border-custom-dark-2 hover:bg-custom-dark-2 hover:text-custom-light';
          
          html += `<a href="/admin/coupon?page=${i}${searchParam}" class="no-underline px-[14px] py-[8px] rounded-md border text-[0.9rem] transition-all duration-300 ${activeClass}">${i}</a>`;
        }
        if (currentPage < totalPages) {
          html += `<a href="/admin/coupon?page=${currentPage + 1}${searchParam}" class="no-underline text-custom-gray px-[14px] py-[8px] rounded-md bg-custom-dark-1 border border-custom-dark-2 text-[0.9rem] transition-all duration-300 hover:bg-custom-dark-2 hover:text-custom-light">Next</a>`
        }
      }

      paginationContainer.innerHTML = html
    }

    paginationContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault()
        const url = new URL(e.target.href)
        const page = url.searchParams.get('page') || 1
        fetchCoupons(page)
      }
    })


    function addEditRemoveButtonListeners() {
      document.querySelectorAll('.edit-btn').forEach((btn) => {
        if (btn.dataset.listenerAttached) return
        btn.dataset.listenerAttached = true
        btn.onclick = () => {
          const couponId = btn.dataset.id
          window.location.href = `/admin/editcoupon/${couponId}`
        }
      })

      document.querySelectorAll('.toggle-status-btn').forEach((btn) => {
        if (btn.dataset.listenerAttached) return
        btn.dataset.listenerAttached = true
        btn.onclick = async () => {
          const couponId = btn.dataset.id
          const currentStatus = btn.dataset.status
          const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
          const actionText = currentStatus === 'active' ? 'deactivate' : 'activate'

          const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: `This will ${actionText} the coupon.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: currentStatus === 'active' ? '#d33' : '#28a745',
            cancelButtonColor: '#555',
            confirmButtonText: `Yes, ${actionText} it!`,
            customClass: { popup: 'swal2-popup' }
          });

          if (confirm.isConfirmed) {
            const url = `/admin/coupon/${newStatus}/${couponId}`
            try {
              const response = await fetch(url, { method: 'PATCH' })
              const result = await response.json()

              if (response.ok) {
                Swal.fire({
                  title: 'Success!', 
                  text: `Coupon is now ${newStatus}.`, 
                  icon: 'success',
                  customClass: { popup: 'swal2-popup' }
                })
                
                const row = document.getElementById(`couponRow-${couponId}`)
                const statusBadge = row.querySelector('.status-badge')
                
                statusBadge.textContent = newStatus
                statusBadge.classList.toggle('bg-green-800', newStatus === 'active')
                statusBadge.classList.toggle('text-green-200', newStatus === 'active')
                statusBadge.classList.toggle('bg-red-800', newStatus === 'inactive')
                statusBadge.classList.toggle('text-red-200', newStatus === 'inactive')

                btn.dataset.status = newStatus
                btn.textContent = newStatus === 'active' ? 'Deactivate' : 'Activate'
                btn.classList.toggle('bg-red-600', newStatus === 'active')
                btn.classList.toggle('hover:bg-red-700', newStatus === 'active')
                btn.classList.toggle('bg-green-600', newStatus === 'inactive')
                btn.classList.toggle('hover:bg-green-700', newStatus === 'inactive')

              } else {
                Swal.fire({
                  title: 'Error', 
                  text: result.message || 'Failed to update status.', 
                  icon: 'error',
                  customClass: { popup: 'swal2-popup' }
                })
              }
            } catch (err) {
              Swal.fire({
                  title: 'Error', 
                  text: 'Something went wrong.', 
                  icon: 'error',
                  customClass: { popup: 'swal2-popup' }
                })
            }
          }
        }
      })
    }
    
    searchInput.addEventListener('input', handleSearch)
    addEditRemoveButtonListeners()