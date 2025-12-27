async function fetchBrands(pageOverride) {
        const searchInput = document.getElementById('searchInput')
        const searchTerm = searchInput.value
        const page = pageOverride || 1
        currentPage = page

        const container = document.getElementById('brand-rows')

        try {
            const response = await fetch(`/admin/brand/data?page=${page}&search=${searchTerm}&limit=${limit}`)
            const data = await response.json()

            container.innerHTML = ''

            const brands = data.brands

            if (!brands || brands.length === 0) {
                container.innerHTML = '<div class="brand-row" style="text-align: center; display: block;">No brands found</div>'
                renderPagination(data.pagination)
                return
            }

            brands.forEach((brand, index) => {
                const sequentialId = (page - 1) * limit + index + 1;
                const imageSrc = brand.brandImage || '/images/default-logo.png'
                
                let actionBtn = '';
                if (brand.status === 'active') {
                    actionBtn = `<a href="#" onclick="confirmAction('block', '${brand._id}')" class="btn-Block">Block</a>`;
                } else {
                    actionBtn = `<a href="#" onclick="confirmAction('unblock', '${brand._id}')" class="btn-Unblock">Unblock</a>`;
                }

                const html = `
                <div class="brand-row">
                    <div class="column-sl">${sequentialId}</div>
                    <div class="column-logo">
                        <img src="${imageSrc}" alt="${brand.brandName} Logo">
                    </div>
                    <div class="column-name">${brand.brandName}</div>
                    <div class="column-status">
                        <span class="status-${brand.status}">${brand.status}</span>
                    </div>
                    <div class="column-edit">
                        <a href="/admin/brand/edit/${brand._id}" class="btn-edit">Edit</a>
                        ${actionBtn}
                    </div>
                </div>`
                
                container.innerHTML += html
            })

            renderPagination(data.pagination)

        } catch (error) {
            console.error("Error fetching brands:", error)
        }
    }

    function renderPagination(paginationData) {
        const pContainer = document.getElementById('pagination')
        pContainer.innerHTML = ''

        if (paginationData.totalPages > 1) {
            
            if (paginationData.currentPage > 1) {
                pContainer.innerHTML += `<a href="#" onclick="changePage(${paginationData.currentPage - 1}, event)">Previous</a>`
            }
            
            for (let i = 1; i <= paginationData.totalPages; i++) {
                const activeClass = i === paginationData.currentPage ? 'active' : ''
                pContainer.innerHTML += `<a href="#" onclick="changePage(${i}, event)" class="${activeClass}">${i}</a>`
            }
    
            if (paginationData.currentPage < paginationData.totalPages) {
                pContainer.innerHTML += `<a href="#" onclick="changePage(${paginationData.currentPage + 1}, event)">Next</a>`
            }
        }
    }


    function changePage(page, event) {
        if(event) event.preventDefault()
        fetchBrands(page)
    }

    function clearSearch(event) {
        if(event) event.preventDefault()
        document.getElementById('searchInput').value = ''
        fetchBrands(1)
    }

    function confirmAction(action, brandId) {
        const isBlocking = action === 'block';
        const url = `/admin/brand/${action}/${brandId}`

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to ${action} this brand.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isBlocking ? '#ff3d3d' : '#00e676',
            cancelButtonColor: '#a5a5a5',
            confirmButtonText: `Yes, ${action} it!`,
            background: '#1c1c1c',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {   
               fetch(url, { 
                   method: 'POST', 
                   headers: { 'Content-Type': 'application/json' }
               })
               .then(response => response.json())
               .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Success!', 
                            text: `Brand has been ${action}ed.`, 
                            icon: 'success',
                            background: '#1c1c1c', 
                            color: '#fff',
                            timer: 1500,
                            showConfirmButton: false
                        })
                        fetchBrands(currentPage)
                    } else {
                        throw new Error(data.message || 'Action failed')
                    }
               })
               .catch(error => {
                    Swal.fire({ title: 'Error!', text: error.message, icon: 'error', background:'#1c1c1c', color:'#fff' })
               })
            }
        })
    }