const form = document.getElementById('addressForm')
    const name = document.getElementById('name')
    const mobile = document.getElementById('mobile')
    const house = document.getElementById('house')
    const street = document.getElementById('street')
    const city = document.getElementById('city')
    const state = document.getElementById('state')
    const Pincode = document.getElementById('pincode')
    const Country = document.getElementById('country')

    const error1 = document.getElementById("error1");
    const error2 = document.getElementById("error2");
    const error3 = document.getElementById("error3");
    const error4 = document.getElementById("error4");
    const error5 = document.getElementById("error5");
    const error6 = document.getElementById("error6");
    const error7 = document.getElementById("error7");
    const error8 = document.getElementById("error8");


    function nameVaildateChecking() {
    const nameval = name.value
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

    function phoneValidateChecking() {
    const phoneVal = mobile.value
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

    function houseValidateChecking() {
    const houseVal = house.value
    const housePattern = /^[A-Za-z0-9\s,\/\-]+$/

    if (houseVal.trim() === '') {
        error3.style.display = "block"
        error3.innerHTML = "Please enter your house or building name"
    } else if (!housePattern.test(houseVal)) {
        error3.style.display = "block";
        error3.innerHTML = "Invalid format — only letters, numbers, spaces, commas, hyphens, and slashes are allowed"
    } else {
        error3.style.display = "none"
        error3.innerHTML = ""
    }
}


    function streetVaildateChecking() {
    const nameval = name.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error4.style.display = "block"
      error4.innerHTML = "Please enter a valid street name"
    } else if (!namepattern.test(nameval)) {
      error4.style.display = "block"
      error4.innerHTML = "street name can only contain alphabets and spaces"
    } else {
      error4.style.display = "none"
      error4.innerHTML = ""
    }
  }

    function cityVaildateChecking() {
    const nameval = city.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error5.style.display = "block"
      error5.innerHTML = "Please enter a valid city name"
    } else if (!namepattern.test(nameval)) {
      error5.style.display = "block"
      error5.innerHTML = "city name can only contain alphabets and spaces"
    } else {
      error5.style.display = "none"
      error5.innerHTML = ""
    }
  }

    function stateVaildateChecking() {
    const nameval = city.value
    const namepattern = /^[A-Za-z\s]+$/
    if (nameval.trim() === '') {
      error6.style.display = "block"
      error6.innerHTML = "Please enter a valid state name"
    } else if (!namepattern.test(nameval)) {
      error6.style.display = "block"
      error6.innerHTML = "state name can only contain alphabets and spaces"
    } else {
      error6.style.display = "none"
      error6.innerHTML = ""
    }
  }

  function pincodeValidateChecking() {
    const pincodeVal = Pincode.value
    const pincodePattern = /^[1-9][0-9]{5}$/;

    if (pincodeVal.trim() === '') {
        error7.style.display = "block"
        error7.innerHTML = "Please enter a pincode"
    } else if (!pincodePattern.test(pincodeVal)) {
        error7.style.display = "block"
        error7.innerHTML = "Invalid pincode format"
    } else {
        error7.style.display = "none"
        error7.innerHTML = ""
    }
}

function countryValidateChecking() {
    const countryVal = Country.value
    const countryPattern = /^[A-Za-z\s]+$/

    if (countryVal.trim() === '') {
        error8.style.display = "block"
        error8.innerHTML = "Please enter a country name"
    } else if(!countryPattern.test(countryVal)) {
        error8.style.display = "block"
        error8.innerHTML = "Country name can only contain letters and spaces"
    } else {
        error8.style.display = "none"
        error8.innerHTML = ""
    }
}

    form.addEventListener('submit', async(e)=>{
        e.preventDefault()

        nameVaildateChecking()
        phoneValidateChecking()
        houseValidateChecking()
        streetVaildateChecking()
        cityVaildateChecking()
        stateVaildateChecking()
        pincodeValidateChecking()
        countryValidateChecking()

         if (
        error1.innerHTML ||
        error2.innerHTML ||
        error3.innerHTML ||
        error4.innerHTML ||
        error5.innerHTML ||
        error6.innerHTML ||
        error7.innerHTML ||
        error8.innerHTML
      ) {
        return
      }


        const formData = new FormData(form)
        const data = Object.fromEntries(formData.entries())
        
        try {
            const response = await fetch(`/account/editAddress/${addressId}`,
            {method:'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:JSON.stringify(data)})

              if (response.ok) {
        const resData = await response.json()

        Swal.fire({
          title: 'Success!',
          text: 'Address edited successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = '/account/address'
        })
      } else {
        const errorData = await response.json()
        Swal.fire({
          title: 'Error',
          text: errorData.message || 'Something went wrong.',
          icon: 'error'
        })
      }
        } catch (error) {
            console.log(error)
        }
    })