 const form = document.getElementById('forgotForm')
  const emailInput = document.getElementById('email')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = emailInput.value.trim()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Email',
        text: 'Please enter a valid email address.'
      })
      return
    }

    try {
      const response = await fetch('/account/newchangeEmailotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent!',
          text: 'An OTP has been sent to your new email address.',
          confirmButtonText: 'OK'
        }).then(() => {
          
          window.location.href = '/account/verify-newemail'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: data.message || 'Something went wrong. Please try again.'
        })
      }

    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again later.'
      })
    }
  })