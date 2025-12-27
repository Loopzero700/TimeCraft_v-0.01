async function fetchData(pageOverride) {
    const searchinput = document.getElementById('searchInput')
    const searchTerm = searchinput.value

    const page = pageOverride || 1
    currentPage = page

    const container = document.getElementById('customer-rows')
    const paginationContainer = document.getElementById('pagination')

    try {
      let url = `/admin/customers/data?page=${page}&search=${searchTerm}&limit=${limit}`
      const response = await fetch(url)
      const data = await response.json()

      container.innerHTML=''

      const customers = data.customers

      if (!customers || customers.length === 0) {
        container.innerHTML = '<div class="customer-row">No customers found</div>';
      } else {

        customers.forEach((cust, index) => {
          
          const displayId = (page - 1) * limit + index + 1
          
          const address = cust.address ? `${cust.address.house_name}, ${cust.address.city}` : 'No Address'
          const mobile = cust.phone || '-'
        
          const btnClass = cust.isBlocked ? 'btn-unblock' : 'btn-block'
          const status = cust.isBlocked ? 'blocked' : 'active'
          const btnText = cust.isBlocked ? 'Unblock' : 'Block'

          const html = `
            <div class="customer-row">
              <div class="column-id">${displayId}</div>
              <div class="column-name">${cust.username}</div>
              <div class="column-email">${cust.email}</div>
              <div class="column-mobile">${mobile}</div>
              <div class="column-address">${address}</div>
              <div class="column-action">
                <a href="#"
                   class="btn-toggle ${btnClass}"
                   data-id="${cust._id}"
                   data-status="${status}">
                   ${btnText}
                </a>
              </div>
            </div>
          `;
          container.innerHTML += html
        })
      }

      renderPagination(data.pagination)

    } catch (error) {
      console.error("Error fetching data:", error)
    }

  } 

  function renderPagination(paginationData) {
    const pContainer = document.getElementById('pagination')
    pContainer.innerHTML = ''

    if (paginationData.totalPages > 1) {
      for (let i = 1; i <= paginationData.totalPages; i++) {
        const activeClass = i === paginationData.currentPage ? 'active' : ''

        const btn = `<a href="#" onclick="changePage(${i}, event)" class="${activeClass}">${i}</a>`
        pContainer.innerHTML += btn
      }
    }
  }


  function changePage(page, event) {
    if(event) event.preventDefault()
    fetchData(page)
  }

  function clearSearch(event) {
    if(event) event.preventDefault()
    document.getElementById('searchInput').value = ''
    fetchData(1)
  }


// user block & unblock function
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-toggle')
    if (!btn) return
    e.preventDefault()

    const id = btn.dataset.id
    const status = btn.dataset.status 
    const action = status === 'blocked' ? 'unblock' : 'block'
    const confirmText = status === 'blocked' ? 'Unblock this customer?' : 'Block this customer?'

    const result = await Swal.fire({
      title: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: status === 'blocked' ? 'Unblock' : 'Block',
      reverseButtons: true,
      background: '#1c1c1c',
      color: '#fff'
    })

    if (!result.isConfirmed) return

    try {
      const endpoint = `/admin/${action}Customer?id=${encodeURIComponent(id)}`
      const res = await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const nowBlocked = action === 'block'
        btn.dataset.status = nowBlocked ? 'blocked' : 'active'
        btn.classList.toggle('btn-block', !nowBlocked)
        btn.classList.toggle('btn-unblock', nowBlocked)
        btn.textContent = nowBlocked ? 'Unblock' : 'Block'

        Swal.fire({
          title: data.message || (nowBlocked ? 'Customer blocked' : 'Customer unblocked'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#1c1c1c',
          color: '#fff'
        })
      } else {
        throw new Error(data.message || 'Request failed')
      }
    } catch (err) {
      console.error('Block/unblock error:', err)
      Swal.fire({ title: 'Error', text: err.message || 'Action failed', icon: 'error' })
    }
  })