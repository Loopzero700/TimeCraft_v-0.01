const tagName = document.querySelector('.profile-name-tag')
const form = document.querySelector('.profile-form')
const usernameinput = document.getElementById('username')
const phoneinput = document.getElementById('phone')
const firstnameinput = document.getElementById('firstname')
const lastnameinput = document.getElementById('lastname')
const editPageBtn = document.getElementById('editPageBtn')
const passChangebtn = document.getElementById('passChange')
const emailChangebtn = document.getElementById('emailChange')

   function customAlert(message, duration = 5000) {
      document.getElementById('alertMessage').textContent = message
      document.getElementById('customAlert').style.display = 'flex'
      setTimeout(() => {
        closeAlert()
      },duration)
    }

     function closeAlert() {
      document.getElementById('customAlert').style.display = 'none'
    }

  editPageBtn.addEventListener('click', () => {
  window.location.href = '/account/edit'
  })

  passChangebtn.addEventListener('click',async ()=>{
   window.location.href = "/account/changePassword"
  })


  emailChangebtn.addEventListener('click',(e)=>{
   window.location.href = "/account/changeEmailotp"
  })