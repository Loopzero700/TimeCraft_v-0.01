 document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('product-form')
        const variantsContainer = document.getElementById('variants-container')
        const addVariantBtn = document.getElementById('btn-add-variant')
        const modal = document.getElementById('cropper-modal')
        const imageToCrop = document.getElementById('image-to-crop')
        const cropButton = document.getElementById('crop-button')
        const cancelCropButton = document.getElementById('cancel-crop-button')

       function showError(input, message) {
       input.classList.add('is-invalid')
       const formGroup = input.closest('.form-group')
        if (formGroup) {
        const error = document.createElement('small')
        error.className = 'error-message'
        error.textContent = message
    
        formGroup.appendChild(error)
        }
    }

    function clearError(input) {
    if (input) {
        input.classList.remove('is-invalid')
        const formGroup = input.closest('.form-group')
        if (formGroup) {
            const error = formGroup.querySelector('.error-message')
            if (error) error.remove()
            const star = formGroup.querySelector('.required-star')
            if (star) star.remove()
        }
    } else {
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
        document.querySelectorAll('.error-message').forEach(el => el.remove())
        }
    }

    function validateForm() {
    clearError()
    let isValid = true
    const productName = form.querySelector('#name');
    const value = productName.value.trim();
          if (value === "") {
          showError(productName, "Name is required")
          isValid = false
                
        } else if (value.length < 3 || value.length > 50) {
          showError(
            productName,
            "Product name must be between 3 and 50 characters"
          )
          isValid = false
        
        } else if (!/^[A-Za-z]+(?:\s[A-Za-z]+)*$/.test(value)) {
          showError(
            productName,
            "Name can contain only letters and single spaces"
          )
          isValid = false
        }

    const category = form.querySelector('#category_id')
    if (!category.value) {
        showError(category, 'Please select a category')
        isValid = false
    }

    const brand = form.querySelector('#brand_id')
    if (!brand.value) {
        showError(brand, 'Please select a brand')
        isValid = false
    }

    // Validate variants
    const variantBlocks = form.querySelectorAll('.variant-block')
    variantBlocks.forEach(block => {
        const color = block.querySelector('input[name*="[color]"]')
        if (!color.value.trim()) {
            showError(color, 'Color is required')
            isValid = false
        }
        const sku = block.querySelector('input[name*="[SKU]"]')
        if (!sku.value.trim()) {
            showError(sku, 'SKU is required')
            isValid = false
        }
        const price = block.querySelector('input[name*="[price]"]')
        if (!price.value || parseFloat(price.value) <= 50) {
            showError(price, 'price is need to be more than 50')
            isValid = false
        }
        const stock = block.querySelector('input[name*="[stock]"]')
        if (!stock.value || parseFloat(stock.value) < 0) {
            showError(stock, 'Stock must be 0 or more')
            isValid = false
        }
        })

        return isValid
        }


        form.addEventListener('submit', async e => {
    e.preventDefault()

    let isValid = true
    const variants = document.querySelectorAll('.variant-block')

    for (let i = 0; i < variants.length; i++) {
        const variant = variants[i]
        
        const imageCount = variant.querySelectorAll('.image-preview-item').length
        
        if (imageCount < 3) {
            e.preventDefault()
            isValid = false
            
            const colorName = variant.querySelector('input[name*="[color]"]').value || `Variant ${i + 1}`

            Swal.fire({
                icon: 'warning',
                title: 'Missing Image',
                text: `Please add at least three image for the ${colorName} variant.`,
                background: '#1c1c1c',
                color: '#e0e0e0',
                confirmButtonColor: '#d33'
            })
            
            return
        }
    }

    if (!validateForm()) return

    const formData = new FormData(form)

    // Add cropped images
    newVariantImages.forEach((blobs, index) => {
        blobs.forEach((blob, fileIndex) => {
            formData.append(`variants[${index}][newImages]`, blob, `variant-${index}-new-image-${fileIndex}.webp`)
            })
        })

        formData.append('imagesToRemove', JSON.stringify(Array.from(imagesToRemove)))

            try {
            const url = form.getAttribute('data-url')
        
            const response = await fetch(url, { method: 'PATCH', body: formData })
            if (response.ok) {
            window.location.href = '/admin/products'
            } else {
            const errorText = await response.text()
            Swal.fire('Error', errorText, 'error')
            }
            } catch (error) {
            Swal.fire('Error', 'An error occurred during submission.', 'error')
            }
        })

        form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => clearError(input))
        })


        let cropper
        let newVariantImages = new Map()
        const imagesToRemove = new Set()

        let imageQueue = []
        let currentVariantBlockForQueue = null

        function processImageQueue() {
            if (imageQueue.length === 0) {
                displayNewImagePreviews(currentVariantBlockForQueue)
                return
            }
            const file = imageQueue.shift()
            const reader = new FileReader()
            reader.onload = () => {
                imageToCrop.src = reader.result
                modal.style.display = 'flex'
                if (cropper) cropper.destroy()
                cropper = new Cropper(imageToCrop, { aspectRatio: 1 / 1, viewMode: 1 })
            }
            reader.readAsDataURL(file)
        }

        cropButton.addEventListener('click', () => {
            if (!cropper) return
            const currentIndex = getCurrentVariantIndex(currentVariantBlockForQueue)
            if (!newVariantImages.has(currentIndex)) {
                newVariantImages.set(currentIndex, [])
            }
            cropper.getCroppedCanvas({ width: 800, height: 800 }).toBlob((blob) => {
                if (blob) newVariantImages.get(currentIndex).push(blob)
                modal.style.display = 'none'
                processImageQueue()
            }, 'image/webp', 0.9)
        })

        
        cancelCropButton.addEventListener('click', () => {
            modal.style.display = 'none'
            imageQueue = []
            if (cropper) {
                cropper.destroy()
                cropper = null
            }
        })

        function displayNewImagePreviews(variantBlock) {
            const previewContainer = variantBlock.querySelector('.image-preview-container')
            const currentIndex = getCurrentVariantIndex(variantBlock)
            const images = newVariantImages.get(currentIndex) || []

            previewContainer.querySelectorAll('.new-preview').forEach(el => el.remove())

            images.forEach((blob, blobIndex) => {
                const previewItem = document.createElement('div')
                previewItem.className = 'image-preview-item new-preview'
                const img = document.createElement('img')
                img.src = URL.createObjectURL(blob)
                const removeBtn = document.createElement('button')
                removeBtn.className = 'remove-new-preview-btn'
                removeBtn.innerHTML = '&times;'
                removeBtn.type = 'button'
                removeBtn.onclick = () => {
                    images.splice(blobIndex, 1)
                    displayNewImagePreviews(variantBlock)
                }
                previewItem.appendChild(img)
                previewItem.appendChild(removeBtn)
                previewContainer.appendChild(previewItem)
            })
        }

       function reindexVariants() {
            const blocks = variantsContainer.querySelectorAll('.variant-block')
            blocks.forEach((block, index) => {
                block.querySelectorAll('input, select, textarea').forEach(input => {
                    const name = input.getAttribute('name')
                    if (name) input.setAttribute('name', name.replace(/\[\d+\]/, `[${index}]`))
                })
                const fileInput = block.querySelector('.variant-images')
                const fileLabel = block.querySelector('.custom-file-button')
                const newFileId = `actual-btn-${index}`
                fileInput.id = newFileId
                if (fileLabel) fileLabel.setAttribute('for', newFileId)
            })
        }

        function reindexVariantImages() {
            const newMap = new Map()
            variantsContainer.querySelectorAll('.variant-block').forEach((block, newIndex) => {
                if (newVariantImages.has(newIndex)) {
                    newMap.set(newIndex, newVariantImages.get(newIndex))
                }
            })
            newVariantImages.clear()
            newVariantImages = newMap
        }

            reindexVariants()
            reindexVariantImages()
            updateRemoveButtons()
        function updateRemoveButtons() {
            const blocks = variantsContainer.querySelectorAll('.variant-block')
            blocks.forEach(block => {
                const removeBtn = block.querySelector('.btn-remove-variant')
                if (removeBtn) removeBtn.style.display = blocks.length > 1 ? 'inline-block' : 'none'
            })
        }
        
        const getCurrentVariantIndex = (block) => {
             return Array.from(variantsContainer.children).indexOf(block)
        }

        function initVariantBlock(block) {
            const fileInput = block.querySelector('.variant-images')
            fileInput.addEventListener('change', (e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                    imageQueue = Array.from(files)
                    currentVariantBlockForQueue = block
                    processImageQueue()
                }
                e.target.value = ''
            })
        }
addVariantBtn.addEventListener('click', () => {
    const newIndex = variantsContainer.children.length;
    const newVariantHtml = `
        <div class="variant-block">
            <input type="hidden" name="variants[${newIndex}][variantId]" value="new">
            <div class="form-grid">
                <div class="form-group"><label>Color</label><input type="text" name="variants[${newIndex}][color]" required></div>
                <div class="form-group"><label>SKU</label><input type="text" name="variants[${newIndex}][SKU]" required></div>
                <div class="form-group"><label>Price</label><input type="number" name="variants[${newIndex}][price]" step="0.01" required></div>
                <div class="form-group"><label>Discounted Price</label><input type="number" name="variants[${newIndex}][discounted_price]" step="0.01"></div>
                <div class="form-group"><label>Stock</label><input type="number" name="variants[${newIndex}][stock]" required></div>
                <div class="form-group">
                    <label>Images</label>
                    <input type="file" id="actual-btn-${newIndex}" class="variant-images" accept="image/*" multiple hidden>
                    <label for="actual-btn-${newIndex}" class="custom-file-button">Add Images</label>
                    <div class="image-preview-container"></div>
                </div>
            </div>
            <button type="button" class="btn-remove-variant">Remove</button>
        </div>`;

    variantsContainer.insertAdjacentHTML('beforeend', newVariantHtml)
    const newBlock = variantsContainer.lastElementChild
    initVariantBlock(newBlock)
    updateRemoveButtons()
})

        variantsContainer.addEventListener('click', e => {
            if (e.target.classList.contains('btn-remove-variant')) {
                const block = e.target.closest('.variant-block')
                const currentIndex = getCurrentVariantIndex(block)
                const variantIdInput = block.querySelector('input[name*="[variantId]"]')
                if (variantIdInput && variantIdInput.value !== 'new') {
                     block.querySelectorAll('.image-preview-item[data-image-url]').forEach(item => {
                        imagesToRemove.add(item.dataset.imageUrl)
                    })
                }
                newVariantImages.delete(currentIndex)
                block.remove()
                reindexVariants()
                updateRemoveButtons()
            }
            if (e.target.classList.contains('remove-image-btn')) {
                const previewItem = e.target.closest('.image-preview-item')
                const imageUrl = previewItem.dataset.imageUrl;
                if (imageUrl) {
                    imagesToRemove.add(imageUrl)

                    previewItem.remove()
                }
            }
        })

        document.querySelectorAll('.variant-block').forEach(block => initVariantBlock(block))
        updateRemoveButtons()
    })