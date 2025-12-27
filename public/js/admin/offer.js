   const searchInput = document.getElementById('searchInput')
    const tableBody = document.getElementById('tableBody')
    const paginationContainer = document.getElementById('pagination')
    
    let currentPageLimit = 10

    function debounce(func, delay) {
      let timer
      return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => func(...args), delay)
      }
    }

    async function fetchOffers(page = 1) {
      const query = searchInput.value.trim()
      const url = `/admin/offer?page=${page}&search=${encodeURIComponent(query)}&json=true&limit=${currentPageLimit}`
      
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Network response was not ok')
        const result = await response.json() 
        
        
        if (result.limit) {
          currentPageLimit = result.limit
        }
        
        updateTable(result.data) 
        updatePagination(result) 
      } catch (err) {
        console.error('Error fetching offers:', err)
        tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-custom-gray">Error loading data.</td></tr>`;
      }
    }

    const handleSearch = debounce(() => {
      fetchOffers(1) 
    }, 500)

    
    function updateTable(offers) {
      tableBody.innerHTML = ''
      
      if (!offers.length) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-custom-gray">No offers found.</td></tr>`
        return
      }

      offers.forEach((offer) => {
        const expiryDate = new Date(offer.expiry_date).toLocaleDateString('en-IN', {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
        
        const statusBadge = offer.status === 'active' 
            ? '<span class="bg-green-500 text-green-900 text-xs font-bold px-2-5 py-0-5 rounded-full ">Active</span>'
            : '<span class="bg-red-500 text-red-900 text-xs font-bold px-2-5 py-0-5 rounded-full ">Inactive</span>'
            
        const toggleBtnText = offer.status === 'active' ? 'Deactivate' : 'Activate'
        const toggleBtnClass = offer.status === 'active' 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-green-500 hover:bg-green-600'

    
        const row = `
          <tr class="hover:bg-custom-dark-2">
            <td class="p-3 font-medium">${offer.offer_name}</td>
            <td class="p-3">${offer.offer_for_type}</td>
            <td class="p-3">${offer.offer_for_id.name}</td>
            <td class="p-3">${offer.discount_percentage}%</td>
            <td class="p-3">${expiryDate}</td>
            <td class="p-3">
              ${statusBadge}
            </td>
            <td class="p-3 flex gap-2">
              <button 
                data-id="${offer._id}" 
                class="edit-btn bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded-md">
                Edit
              </button>
              <button 
                data-id="${offer._id}" 
                data-status="${offer.status}"
                class="toggle-status-btn text-white text-sm font-medium py-1 px-3 rounded-md ${toggleBtnClass} status_Btn">
                ${toggleBtnText}
              </button>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row)
      })
    }

    
    function updatePagination({ totalPages, currentPage, search }) {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const createPageLink = (page, text, additionalClasses = '') => {
            const link = document.createElement('a');
            link.href = `/admin/offer?page=${page}${searchParam}`
            link.innerHTML = text
            link.dataset.page = page            
            let classes = 'no-underline px-[14px] py-[8px] rounded-md border text-[0.9rem] transition-all duration-300 '
            
            if (additionalClasses) {
                classes += additionalClasses
            } else {
            
                classes += (page === currentPage)
                    ? 'bg-custom-orange text-white border-custom-orange'
                    : 'text-custom-gray bg-custom-dark-1 border-custom-dark-2 hover:bg-custom-dark-2 hover:text-custom-light';
            }
            
            link.className = classes
            return link
        }
        
        const prevNextClass = 'text-custom-gray bg-custom-dark-1 border-custom-dark-2 hover:bg-custom-dark-2 hover:text-custom-light'

        if (currentPage > 1) {
            paginationContainer.appendChild(
                createPageLink(currentPage - 1, 'Previous', prevNextClass)
            )
        }

        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.appendChild(
                createPageLink(i, i)
            )
        }

        if (currentPage < totalPages) {
            paginationContainer.appendChild(
                createPageLink(currentPage + 1, 'Next', prevNextClass)
            )
        }
    }

    searchInput.addEventListener('input', handleSearch)
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn')
        const toggleBtn = e.target.closest('.toggle-status-btn')

        if (editBtn) {
            const id = editBtn.dataset.id
            console.log(`Edit button clicked for ID: ${id}`)
            window.location.href = `/admin/editOffer/${id}`
        }

        if (toggleBtn) {
            const id = toggleBtn.dataset.id
            const currentStatus = toggleBtn.dataset.status
            console.log(`Toggle status clicked for ID: ${id}, Current Status: ${currentStatus}`)
      
        }
    })
    
    paginationContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-page]')
        if (link) {
            e.preventDefault()
            const page = parseInt(link.dataset.page, 10)
            if (!isNaN(page)) {
                fetchOffers(page)
            }
        }
    })

tableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn')
        const toggleBtn = e.target.closest('.toggle-status-btn')

        if (editBtn) {
            const id = editBtn.dataset.id
            window.location.href = `/admin/editOffer/${id}`
        }

        if (toggleBtn) {
            toggleBtn.disabled = true; 

            const offerId = toggleBtn.dataset.id
            const currentStatus = toggleBtn.dataset.status
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            const actionText = currentStatus === 'active' ? 'deactivate' : 'activate'

            try {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: `This will ${actionText} the offer.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: currentStatus === 'active' ? '#d33' : '#28a745',
                    cancelButtonColor: '#555',
                    confirmButtonText: `Yes, ${actionText} it!`,
                    customClass: {
                        popup: 'bg-custom-dark-2 text-custom-light',
                        confirmButton: `bg-${currentStatus === 'active' ? 'red' : 'green'}-500`,
                    }
                })

                if (result.isConfirmed) {
                    const url = `/admin/offer/${newStatus}/${offerId}`
                    const response = await fetch(url, { method: 'PATCH' })

                    if (!response.ok) {
                        throw new Error('Server responded with an error.')
                    }

                    const responseData = await response.json()

                    toggleBtn.dataset.status = newStatus
                    toggleBtn.textContent = newStatus === 'active' ? 'Deactivate' : 'Activate'

                    if (newStatus === 'active') {
                        toggleBtn.classList.remove('bg-green-500', 'hover:bg-green-600')
                        toggleBtn.classList.add('bg-red-500', 'hover:bg-red-600')
                    } else {
                        toggleBtn.classList.remove('bg-red-500', 'hover:bg-red-600')
                        toggleBtn.classList.add('bg-green-500', 'hover:bg-green-600')
                    }

                    const row = toggleBtn.closest('tr')
                    const statusBadgeCell = row.querySelector('td:nth-child(6)')

                    if (newStatus === 'active') {
                        statusBadgeCell.innerHTML = '<span class="bg-green-500 text-green-900 text-xs text-white font-bold px-2.5 py-0.5 rounded-full">Active</span>'
                    } else {
                        statusBadgeCell.innerHTML = '<span class="bg-red-500 text-red-900 text-xs text-white font-bold px-2.5 py-0.5 rounded-full">Inactive</span>'
                    }

                    Swal.fire(
                        'Success!',
                        `Offer has been ${actionText}d.`,
                        'success'
                    );
                }

            } catch (error) {
                console.error('Error toggling status:', error);
                Swal.fire(
                    'Error!',
                    'Could not update the offer status. Please try again.',
                    'error'
                );
            } finally {
                toggleBtn.disabled = false
            }
        }
    })