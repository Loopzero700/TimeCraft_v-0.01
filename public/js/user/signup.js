const nameid = document.getElementById('username')
  const emailid = document.getElementById('email')
  const passid = document.getElementById('password')
  const cpassid = document.getElementById('Confirm_password')

  const error1 = document.getElementById('error1')
  const error2 = document.getElementById('error2')
  const error3 = document.getElementById('error3')
  const error4 = document.getElementById('error4')

  const signform = document.getElementById('signform')


  function nameVaildateChecking() {
    const nameval = nameid.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error1.style.display = "block"
      error1.innerHTML = "Please enter a valid name"
    } else if (!namepattern.test(nameval)) {
      error1.style.display = "block"
      error1.innerHTML = "Name can only contain alphabets and spaces"
    } else {
      error1.style.display = "none"
      error1.innerHTML = ""
    }
  }


  function emailValidateChecking() {
    const emailval = emailid.value
    const emailpattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!emailpattern.test(emailval)) {
      error2.style.display = "block"
      error2.innerHTML = "Invalid email format"
    } else {
      error2.style.display = "none"
      error2.innerHTML = ""
    }
  }


  function passVaildateChecking() {
    const passval = passid.value
    const cpassval = cpassid.value
    const alpha = /[a-zA-Z]/
    const digit = /\d/

    if (passval.length < 8) {
      error3.style.display = "block"
      error3.innerHTML = "Should contain at least 8 characters"
    } else if (!alpha.test(passval) || !digit.test(passval)) {
      error3.style.display = "block"
      error3.innerHTML = "Password should contain letters and numbers"
    } else {
      error3.style.display = "none"
      error3.innerHTML = ""
    }

    if (cpassval === '') {
      error4.style.display = "none"
      error4.innerHTML = ""
    } else if (passval !== cpassval) {
      error4.style.display = "block"
      error4.innerHTML = "Passwords do not match"
    } else {
      error4.style.display = "none"
      error4.innerHTML = ""
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    signform.addEventListener("submit", async function (e) {
      e.preventDefault()

      nameVaildateChecking()
      emailValidateChecking()
      passVaildateChecking()

      if (
        error1.innerHTML ||
        error2.innerHTML ||
        error3.innerHTML ||
        error4.innerHTML
      ) {
        return
      }
      const formData = new FormData(signform);
      const data = Object.fromEntries(formData.entries())

      try {
        const response = await fetch('/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })

        const result = await response.json();

        if (result.success) {
          window.location.href = result.redirectUrl;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: result.message,
            confirmButtonColor: '#3085d6'
          })
        }
      } catch (error) {
        console.error('Error during signup:', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong! Please try again.',
          confirmButtonColor: '#3085d6'
        })
      }
    })
  })