document.addEventListener('DOMContentLoaded', () => {
    const wishlistbtn = document.querySelector('.wishlist-btn') 
    wishlistbtn.addEventListener('click', async (e) => {
                const productId = e.currentTarget.dataset.id
                const selectedVariant = document.querySelector('input[name="color"]:checked')
                const index = selectedVariant ? selectedVariant.dataset.index : 0
                try {
                    const response = await fetch('/addWishlist', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            productId,
                            index
                        })
                    })
                    const data = await response.json()
                    const heartIcon = document.querySelector('.heart-Icon')
                    if(response.status===401){
                        window.location.href='/login'
                    }
                    if (response.ok) {
                        Swal.fire({
                            title: data.message ==="Item already in the cart❗" ? 'Item in the Cart' : 'Added to Wishlist ❤️',
                            text: data.message || 'Item saved successfully!',
                            icon: data.message ==="Item already in the cart❗" ? 'warning' : 'success', 
                            timer: 1500,
                            showConfirmButton: false
                        }).then(()=>{
                            if(heartIcon.classList.contains('fa-solid')){
                                heartIcon.classList.remove('fa-solid')
                                heartIcon.classList.add('fa-regular')
                            }else{
                                heartIcon.classList.remove('fa-regular')
                                heartIcon.classList.add('fa-solid')
                            }
                        })
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message || 'Failed to add item.',
                            icon: 'error'
                        })
                    }
                } catch (err) {
                    console.error('Wishlist error:', err)
                    Swal.fire('Error', 'Something went wrong', 'error')
                }
            })
        })

            document.querySelectorAll('.card-wishlist-btn').forEach(btn=>{
                btn.addEventListener('click',async(e)=>{
                    e.preventDefault()
                    const productId = e.currentTarget.dataset.id
                    try {
                    const response = await fetch('/addWishlist', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            productId
                        })
                    })
                    const data = await response.json()

                    if (response.status === 401 || data.message === "user not found") {
                       window.location.href = '/login'
                        return
                        }
                    
                    if (response.ok) {
                        Swal.fire({
                            title: 'Added to Wishlist ❤️',
                            text: data.message || 'Item saved successfully!',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        })
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message || 'Failed to add item.',
                            icon: 'error'
                        })
                    }
                } catch (err) {
                    console.error('Wishlist error:', err)
                    Swal.fire('Error', 'Something went wrong', 'error')
                }
                })
            })


    $(document).ready(function() {

        const productId = productData._id
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const host = window.location.host;
        const socket = new WebSocket(`${protocol}${host}`);

        socket.onopen=()=>{
            console.log('WebSocket connection established.')
            socket.send(JSON.stringify({
                event: 'viewing_product',
                productId:productId
            }))
        }
           socket.onmessage = (event)=>{
            const data = JSON.parse(event.data)

            if(data.event === 'product_blocked'){
                window.location.href='/shop'
            }
           } 

        
        function initializeZoom(){
            console.log(productData)
        $('#main-product-image').elevateZoom({
         zoomType: 'window',
        zoomWindowWidth: 500,
        zoomWindowHeight: 500,
        zoomWindowFadeIn: 400,
        zoomWindowFadeOut: 400,
        scrollZoom: true,
        cursor: 'crosshair',
        easing: true,
    })
        }

        initializeZoom()

        $('.thumbnails').on('click','.thumbnail-img',function(){
                    const newImageSrc = $(this).attr('src')

                    $('#main-product-image').attr('src',newImageSrc)

                    $('.zoomContainer').remove()
                    $('#main-product-image').data('zoom-image',newImageSrc)
                    initializeZoom()

                    $('.thumbnail-img').removeClass('active')
                    $(this).addClass('active')
                })
            
                $('input[name="color"]').on('change', function() {
            const selectedIndex = $(this).data('index')
            const selectedVariant = productData.variants[selectedIndex]
                
            const originalPrice = selectedVariant.price
            let discountedPrice = selectedVariant.discounted_price
                
            if (!discountedPrice || discountedPrice > originalPrice) {
                discountedPrice = originalPrice
            }
        
            $('.price-main').text(`₹${discountedPrice}`)
            $('.price-original').text(`₹${originalPrice}`)
        
            let discount = 0
            if (originalPrice > discountedPrice) {
                discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
            }
        
            const stock = selectedVariant.stock
        
            if (stock <= 0) {
                $('.actions-container').hide()
                $('.out-Of-stock').show()
            } else {
                $('.actions-container').show()
                $('.out-Of-stock').hide()
            }
        
            if (discount > 0) {
                $('.price-discount').text(`${discount}% off`).show()
                $('.price-original').show()
            } else {
                $('.price-discount').hide()
                $('.price-original').hide()
            }
        
            $('.sku').text(`SKU: ${selectedVariant.SKU}`)
        
            const thumbnailsContainer = $('.thumbnails')
            thumbnailsContainer.empty()
        
            selectedVariant.image_url.forEach((image, index) => {
                const thumbnailHtml = `<img src="${image}" alt="Watch Thumbnail" class="thumbnail-img ${index === 0 ? 'active' : ''}">`
                thumbnailsContainer.append(thumbnailHtml)
            })
        
            const firstImage = selectedVariant.image_url[0]
            $('#main-product-image').attr('src', firstImage)
        
            $(".zoomContainer").remove()
            $('#main-product-image').data('zoom-image', firstImage)
            initializeZoom()
        })
    })


   const addCart = document.getElementById('addCart')
   addCart.addEventListener('click', async(e)=>{
    const productId = e.target.dataset.id
    const selectedVariant = document.querySelector('input[name="color"]:checked')
    const index = selectedVariant ? selectedVariant.dataset.index : 0

    if(!productId) return

    try {
       const response = await fetch('/addCart', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variant: Number(index),
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
        
    }

   })
   
   function toggleReadMore(productId) {
        const description = document.getElementById(`desc-${productId}`)
        const button = document.getElementById(`btn-${productId}`)

        description.classList.toggle('line-clamp-3');
        if (description.classList.contains('line-clamp-3')) {
            button.innerText = 'Read More'
        } else {
            button.innerText = 'Read Less'
        }
    }