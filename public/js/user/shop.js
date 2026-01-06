document.addEventListener('DOMContentLoaded', () => {

        const clearFiltersBtn = document.getElementById('clear-filters-btn')
        const searchClearBtn = document.querySelector('.search-clear')
        const searchInput = document.querySelector('.search-container input[type="search"]')
        const searchBtn = document.querySelector('.search-btn')
        const sortSelect = document.getElementById('sort')
        const prevPageBtn = document.getElementById('prev-page')
        const nextPageBtn = document.getElementById('next-page')
        const productGrid = document.querySelector('.product-grid')
        const paginationContainer = document.querySelector('.pagination')
        const paginationInfo = document.querySelector('.pagination span')
        const loadingIndicator = document.querySelector('.loading')


        productGrid.addEventListener('click', async (e) => {

            const wishlistBtn = e.target.closest('.wishlist-btn')
            if (wishlistBtn) {
                e.preventDefault()
                const productId = wishlistBtn.dataset.id
                try {
                    const response = await fetch('/addWishlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId })
                    })
                    const data = await response.json()
                    if (response.status === 401 || data.message === "user not found") {
                        window.location.href = data.url || '/login'
                        return
                    }
                    if (response.ok) {
                        Swal.fire({
                            title: data.message ==="Item already in the cart❗" ? 'Item in the Cart' : 'Added to Wishlist ❤️',
                            text: data.message || 'Item saved successfully!',
                            icon: data.message ==="Item already in the cart❗" ? 'warning' : 'success', 
                            timer: 1500,
                            showConfirmButton: false
                        }).then(()=>{
                            fetchProducts()
                        })
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message || 'Failed to add item.',
                            icon: 'error'
                        })
                    }
                } catch (err) {
                    console.error('Wishlist error:', err);
                    Swal.fire('Error', 'Something went wrong', 'error');
                }
                return
            }

            const cartBtn = e.target.closest('.add-to-cart-btn');
            if (cartBtn) {
                e.preventDefault();
                const productId = cartBtn.dataset.id
                const index = 0
                if (!productId) return

                try {
                    const response = await fetch('/addCart', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            productId,
                            variant: index,
                            quantity: 1
                        })
                    })
                    const data = await response.json()
                    if (response.ok) {
                        Swal.fire({
                            title: "Added to Cart 🛒",
                            text: data.message || "Item successfully added to your cart!",
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false
                        })
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text: data.message || "Failed to add item to cart.",
                            icon: "error"
                        })
                    }
                } catch (error) {
                    console.log(error);
                    Swal.fire('Error', 'Something went wrong', 'error');
                }
            }
        })

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const host = window.location.host;
        const socket = new WebSocket(`${protocol}${host}`);
        socket.onopen = () => {
            console.log('WebSocket connection established.')
            socket.send(JSON.stringify({
                event: 'viewing_shop'
            }))
        }
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.event === 'product_blocked') {
                handleFilterChange()
            }
        }

        async function fetchProducts() {
            loadingIndicator.style.display = 'block'

            const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
                .map(cb => cb.value).join(',')
            const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked'))
                .map(cb => cb.value).join(',')
            const minPrice = document.getElementById('min-price').value
            const maxPrice = document.getElementById('max-price').value
            const searchTerm = searchInput.value
            const sortOption = sortSelect.value

            const params = new URLSearchParams()
            if (selectedCategories) params.append('category', selectedCategories)
            if (selectedBrands) params.append('brand', selectedBrands)
            if (minPrice) params.append('minPrice', minPrice)
            if (maxPrice) params.append('maxPrice', maxPrice)
            if (searchTerm) params.append('search', searchTerm)
            if (sortOption !== 'default') params.append('sort', sortOption)
            params.append('page', currentPage)

            const url = `/shop?${params.toString()}`

            try {
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                })
                if (!response.ok) throw new Error('Network response was not ok')
                
                const data = await response.json()
                updateUI(data)
            } catch (error) {
                console.error('Failed to fetch products:', error)
                productGrid.innerHTML = '<p class="no-products">Failed to load products. Please try again later.</p>'
            } finally {
                loadingIndicator.style.display = 'none'
            }
        }

        function handleClearFilters() {
            document.querySelectorAll('input[name="category"]:checked').forEach(cb => cb.checked = false)
            document.querySelectorAll('input[name="brand"]:checked').forEach(cb => cb.checked = false)
            document.getElementById('min-price').value = ''
            document.getElementById('max-price').value = ''
            if (searchInput) searchInput.value = ''
            if (sortSelect) sortSelect.value = 'default'
            currentPage = 1
            fetchProducts()
        }

        function updateUI(data) {
            updateProductGrid(data.results,data.wishlistData)
            updatePagination(data)
        }

        function updateProductGrid(products,wishlistData) {
            productGrid.innerHTML = ''

            if (!products || products.length === 0) {
                productGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>'
                return
            }

            products.forEach(product => {
                const productCard = document.createElement('article')
                productCard.className = 'product-card'

                const priceHtml = product.variants[0]?.discounted_price
                    ? `<span class="old-price">₹${product.variants[0].price}</span>
                       <span class="new-price">₹${product.variants[0].discounted_price}</span>`
                    : `<span class="new-price">₹${product.variants[0]?.price || "N/A"}</span>`

                const heartIcon = wishlistData.includes(product._id.toString())
                                    ? '<i class="fa-solid fa-heart heart-icon"></i>'
                                    : '<i class="fa-regular fa-heart heart-icon"></i>';

                const productBtn = product.variants[0].stock!==0 ? ` <button class="add-to-cart-btn" data-id="${product._id}">
                                                                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                                                                    </button>`
                                                                    : `<button class="add-to-cart-btn btn-disabled" disabled>
                                                                    <i class="fa-solid fa-ban"></i> Out of Stock </button>`

                productCard.innerHTML = `
                    <a href="/product/${product._id}">
                        <div class="product-image-container">
                            <img src="${product.variants[0]?.image_url?.[0] || '/images/default.png'}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <div class="product-title">
                                <h3>${product.name}</h3>
                                <a class="wishlist-btn" data-id="${product._id}">
                                    ${heartIcon}
                                </a>
                            </div>
                            <p class="product-price">${priceHtml}</p>
                        </div>
                    </a>
                    ${productBtn}
                `;
                productGrid.appendChild(productCard)
            })
            
        }

        function updatePagination(data) {
            currentPage = data.page
            totalPages = data.totalPages
            paginationInfo.textContent = `Page ${data.page} of ${data.totalPages}`
            prevPageBtn.disabled = data.page <= 1
            nextPageBtn.disabled = data.page >= data.totalPages
            paginationContainer.style.display = data.totalPages <= 1 ? 'none' : 'flex'
        }
        function handleFilterChange() {
            currentPage = 1
            fetchProducts()
        }

        clearFiltersBtn.addEventListener('click', handleClearFilters)

        const allFilterCheckboxes = document.querySelectorAll('input[name="category"], input[name="brand"]')
        allFilterCheckboxes.forEach(checkbox => checkbox.addEventListener('change', handleFilterChange))

        const priceInputs = document.querySelectorAll('#min-price, #max-price')
        priceInputs.forEach(input => input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') handleFilterChange()
        }))

        searchBtn.addEventListener('click', handleFilterChange);
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') handleFilterChange();
        });

        searchInput.addEventListener('input', () => {
            searchClearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
        });
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchClearBtn.style.display = 'none';
            handleFilterChange();
        });

        sortSelect.addEventListener('change', handleFilterChange);

        
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--
                fetchProducts()
            }
        })
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++
                fetchProducts()
            }
        })

    })