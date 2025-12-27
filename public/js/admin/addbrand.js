 const form = document.getElementById('add-brand-form')
    const brandNameInput = document.getElementById('brandName')
    const fileInput = document.getElementById('brandImageInput')
    const fileNameDisplay = document.getElementById('file-name-display')
    const preview = document.getElementById('cropped-image-preview')
    const modal = document.getElementById('cropper-modal')
    const imageToCrop = document.getElementById('image-to-crop')
    const cropButton = document.getElementById('crop-button')

    let cropper
    let croppedBlob = null

    
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files
        if (files && files.length > 0) {
            fileNameDisplay.textContent = files[0].name
            const reader = new FileReader()
            reader.onload = () => {
                imageToCrop.src = reader.result
                modal.style.display = 'flex'
                if (cropper) cropper.destroy()
                cropper = new Cropper(imageToCrop, { aspectRatio: 1 / 1, viewMode: 1 })
            }
            reader.readAsDataURL(files[0])
        }
    })

    
    cropButton.addEventListener('click', () => {
        cropper.getCroppedCanvas({ width: 500, height: 500 }).toBlob((blob) => {
            croppedBlob = blob
            preview.src = URL.createObjectURL(blob)
            preview.style.display = 'block'
        }, 'image/png')
        modal.style.display = 'none'
        cropper.destroy()
    })

    
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        if (!croppedBlob) {
            Swal.fire('Error', 'Please select and crop an image first.', 'error')
            return
        }

        const formData = new FormData()
        formData.append('brandName', brandNameInput.value)
        
        formData.append('brandImage', croppedBlob, 'brand-logo.webp')

        try {
            const response = await fetch('/admin/brand', { method: 'POST', body: formData })
            if (response.ok) {
                window.location.href = '/admin/brand'
            } else {
                const errorText = await response.text()
                Swal.fire('Error', errorText, 'error')
            }
        } catch (error) {
            Swal.fire('Error', 'An error occurred while uploading.', 'error')
        }
    })