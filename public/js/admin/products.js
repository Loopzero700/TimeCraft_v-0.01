async function fetchProducts(pageOverride) {
        const searchInput = document.getElementById('searchInput')
        const searchTerm = searchInput.value
        const page = pageOverride || 1
        currentPage = page

        const container = document.getElementById('product-rows')

        try {
            
            const response = await fetch(`/admin/products/data?page=${page}&search=${searchTerm}&limit=${limit}`)
            const data = await response.json()

            if (data.error) throw new Error(data.error)
            
            container.innerHTML = ''
            const products = data.products

            if (!products || products.length === 0) {
                container.innerHTML = '<div class="table-row no-data">No products found.</div>';
            } else {
                products.forEach(product => {
                    const variant = product.variants && product.variants[0];
                    const price = variant ? '₹' + variant.price.toLocaleString('en-IN') : 'N/A';
                    const stock = variant ? variant.stock : 'N/A';
                    const category = product.category ? product.category.name : 'Uncategorized';
                    
                    const isInactive = product.status !== 'active';
                    const statusClass = isInactive ? 'status-inactive' : 'status-active';
                    
                    const actionBtn = isInactive
                        ? `<a href="#" onclick="confirmAction('active', '${product._id}')" class="btn btn-unblock">Active</a>`
                        : `<a href="#" onclick="confirmAction('inactive', '${product._id}')" class="btn btn-remove">Inactive</a>`;

                    const html = `
                        <div class="table-row">
                            <div class="col col-product">${product.name}</div>
                            <div class="col col-price">${price}</div>
                            <div class="col col-stock"><span class="stock-badge">${stock}</span></div>
                            <div class="col col-category">${category}</div>
                            <div class="col col-status"><span class="status ${statusClass}">${product.status}</span></div>
                            <div class="col col-action">
                                <a href="/admin/editproduct/${product._id}" class="btn btn-edit">Edit</a>
                                ${actionBtn}
                            </div>
                        </div>
                    `;
                    container.innerHTML += html;
                })
            }
            renderPagination(data.pagination)

        } catch (error) {
            console.error("Error fetching products:", error)
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
        fetchProducts(page)
    }

    function clearSearch(event) {
        if(event) event.preventDefault()
        document.getElementById('searchInput').value = ''
        fetchProducts(1)
    }

    function confirmAction(action, productId) {
        const isDeactivating = action === 'inactive'
        const btnColor = isDeactivating ? '#d33' : '#28a745'
        const btnText = isDeactivating ? 'Yes, make inactive!' : 'Yes, make active!'

        Swal.fire({
            title: 'Are you sure?',
            text: `Change status to ${action}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: btnColor,
            cancelButtonColor: '#3085d6',
            confirmButtonText: btnText,
            background: '#1c1c1c',
            color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    
                    const response = await fetch(`/admin/product/${action}/${productId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    })
                    const data = await response.json()

                    if (data.success) {
                        Swal.fire({
                            title: 'Updated!',
                            text: `Product is now ${action}.`,
                            icon: 'success',
                            background: '#1c1c1c',
                            color: '#fff',
                            timer: 1500,
                            showConfirmButton: false
                        })

                        fetchProducts(currentPage)
                    } else {
                        throw new Error(data.message || 'Action failed')
                    }
                } catch (error) {
                    Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1c1c1c' })
                }
            }
        })
    }