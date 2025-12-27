 const submitbtn = document.querySelector('.submit-btn')
  const passwordInput = document.getElementById('password')

  submitbtn.addEventListener('click', async (e) => {
    e.preventDefault()
    const password = passwordInput.value
    try {
      const response = await fetch('/account/changePassVerify', {
        method: 'POST',
        body: JSON.stringify({ userpass: password }),
        headers: { 'Content-Type': 'application/json' }
      })

      const res = await response.json()

      if (response.ok) {
        window.location.href = '/account/newPassword'
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: res.message || 'Invalid password. Please try again.'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again later.'
      })
    }
  })