 async function fetchCategory(pageOverride) {
        const searchInput = document.getElementById('searchInput')
        const searchTerm = searchInput.value
        const page = pageOverride || 1
        currentPage = page

        const container = document.getElementById('category-rows')

        try {
    
            const response = await fetch(`/admin/category/data?page=${page}&search=${searchTerm}&limit=${limit}`)
            const data = await response.json()

            container.innerHTML = ''
            
            const categories = data.cat

            if (!categories || categories.length === 0) {
                container.innerHTML = '<div class="no-data">No categories found</div>';
                renderPagination(data.pagination)
                return
            }

            categories.forEach((category, index) => {
                const sequentialId = (page - 1) * limit + index + 1
                const isBlocked = category.status !== 'active'
                const statusClass = !isBlocked ? 'status-active' : 'status-inactive'
                
            
                const actionBtn = isBlocked
                    ? `<button onclick="confirmStatusChange('${category._id}', true)" class="btn-unblock">Active</button>`
                    : `<button onclick="confirmStatusChange('${category._id}', false)" class="btn-block">Inactive</button>`

                const html = `
                <div class="data-row">
                    <div class="column-id">${sequentialId}</div>
                    <div class="column-name">${category.name}</div>
                    <div class="column-status">
                        <span class="status ${statusClass}">${category.status}</span>
                    </div>
                    <div class="column-action">
                        <a class="btn-edit" href="/admin/categories/edit/${category._id}">Edit</a>
                        ${actionBtn}
                    </div>
                </div>`;
                
                container.innerHTML += html
            })

            
            renderPagination(data.pagination)

        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    
    function renderPagination(paginationData) {
        const pContainer = document.getElementById('pagination');
        pContainer.innerHTML = ''

        if (paginationData.totalPages > 1) {
            
            if (paginationData.currentPage > 1) {
                pContainer.innerHTML += `<a href="#" onclick="changePage(${paginationData.currentPage - 1}, event)">Previous</a>`;
            }
            
            for (let i = 1; i <= paginationData.totalPages; i++) {
                const activeClass = i === paginationData.currentPage ? 'active' : '';
                pContainer.innerHTML += `<a href="#" onclick="changePage(${i}, event)" class="${activeClass}">${i}</a>`
            }
            
            if (paginationData.currentPage < paginationData.totalPages) {
                pContainer.innerHTML += `<a href="#" onclick="changePage(${paginationData.currentPage + 1}, event)">Next</a>`
            }
        }
    }

    
    function changePage(page, event) {
        if(event) event.preventDefault()
        fetchCategory(page)
    }

    function clearSearch(event) {
        if(event) event.preventDefault()
        document.getElementById('searchInput').value = ''
        fetchCategory(1)
    }
 
    
    function confirmStatusChange(categoryId, isCurrentlyBlocked) {
        const action = isCurrentlyBlocked ? 'active' : 'inactive'
        
        
        const url = `/admin/categories/${action}/${categoryId}`;

        Swal.fire({
            title: 'Are you sure?',
            text: `This will make the category ${action}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isCurrentlyBlocked ? '#00e676' : '#ff3d3d',
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
                    if(data.success) {
                        Swal.fire({
                            title: 'Success!', 
                            text: `Category is now ${action}.`, 
                            icon: 'success',
                            background: '#1c1c1c',
                            color: '#fff',
                            timer: 1500,
                            showConfirmButton: false
                        })
                        fetchCategory(currentPage)
                    } else {
                        throw new Error(data.message || 'Action failed')
                    }
                })
                .catch(error => {
                    Swal.fire({ 
                        title: 'Error!', 
                        text: error.message, 
                        icon: 'error',
                        background: '#1c1c1c',
                        color: '#fff' 
                    })
                })
            }
        })
    }