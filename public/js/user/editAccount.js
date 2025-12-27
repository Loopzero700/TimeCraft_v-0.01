const fileInput = document.getElementById('profile-picture-upload')
const cropperModal = document.getElementById('cropperModal')
const cropperImage = document.getElementById('cropperImage')
const closeCropper = document.getElementById('closeCropper')
const cancelCrop = document.getElementById('cancelCrop')
const saveCrop = document.getElementById('saveCrop')
const profileImg = document.getElementById('currentProfile')


const username = document.getElementById('username')
const phone = document.getElementById('phone')
const firstname = document.getElementById('firstname')
const lastname = document.getElementById('lastname')  


 function usernameVaildateChecking() {
    const nameval = username.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error1.style.display = "block"
      error1.innerHTML = "Please enter a valid username"
    } else if (!namepattern.test(nameval)) {
      error1.style.display = "block"
      error1.innerHTML = "username can only contain alphabets and spaces"
    } else {
      error1.style.display = "none"
      error1.innerHTML = ""
    }
  }

  function firstnameVaildateChecking() {
    const nameval = firstname.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error3.style.display = "block"
      error3.innerHTML = "Please enter a valid firstname"
    } else if (!namepattern.test(nameval)) {
      error3.style.display = "block"
      error3.innerHTML = "firstname can only contain alphabets and spaces"
    } else {
      error3.style.display = "none"
      error3.innerHTML = ""
    }
  }

    function lastnameVaildateChecking() {
    const nameval = lastname.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error4.style.display = "block"
      error4.innerHTML = "Please enter a valid lastname"
    } else if (!namepattern.test(nameval)) {
      error4.style.display = "block"
      error4.innerHTML = "lastname can only contain alphabets and spaces"
    } else {
      error4.style.display = "none"
      error4.innerHTML = ""
    }
  }


  function phoneValidateChecking() {
    const phoneVal = phone.value
    const phonePattern = /^[6-9]\d{9}$/;
    if (phoneVal.trim() === '') {
        error2.style.display = "block"
        error2.innerHTML = "Please enter a phone number"
    } else if (!phonePattern.test(phoneVal)) {
        error2.style.display = "block"
        error2.innerHTML = "Phone number must be 10 digits and start with 6-9"
    } else {
        error2.style.display = "none"
        error2.innerHTML = ""
    }
}



let cropper = null

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    cropperImage.src = reader.result

    cropperImage.onload = () => {
      cropperModal.classList.remove('hidden')
      cropperModal.classList.add('flex')

      if (cropper) cropper.destroy()

      cropper = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        autoCropArea: 1
      })
    }
  }
  reader.readAsDataURL(file)
})

function closeCropperModal() {
  cropperModal.classList.add('hidden')
  cropperModal.classList.remove('flex')
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
  fileInput.value = '' 
}

closeCropper.addEventListener('click', closeCropperModal)
cancelCrop.addEventListener('click', closeCropperModal)

// Save cropped image
saveCrop.addEventListener('click', async () => {
  if (!cropper) return

  const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 })
  if (!canvas) return

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'))
  const formData = new FormData()
  formData.append('profile_photo', blob)

  try {
    const res = await fetch('/account/uploadProfile', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const data = await res.json()
      profileImg.src = data.url + '?t=' + new Date().getTime()
      closeCropperModal()

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        showConfirmButton: false,
        timer: 1000
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Something went wrong while uploading.'
      })
    }
  } catch (err) {
    console.error('Upload error:', err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while uploading the profile photo.'
    })
  }
})

// Update user info
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.getElementById('username').value.trim()
  const phone = document.getElementById('phone').value.trim()
  const firstname = document.getElementById('firstname').value.trim()
  const lastname = document.getElementById('lastname').value.trim()

  usernameVaildateChecking()
  lastnameVaildateChecking()
  firstnameVaildateChecking()
  phoneValidateChecking()

  

  if (
        error1.innerHTML ||
        error2.innerHTML ||
        error3.innerHTML ||
        error4.innerHTML
      ) {
        return
      }

  try {
    const response = await fetch('/account/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phone, firstname, lastname })
    })

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        showConfirmButton: false,
        timer: 1000
      }).then(() => {
        window.location.href = '/account'
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error updating details'
      })
    }
  } catch (err) {
    console.error(err)
  }
})