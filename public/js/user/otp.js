 let timeLeft = 60;
  let interval;
  const timerElement = document.getElementById("otp-timer");

  function startTimer() {
    interval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      timerElement.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
      timeLeft--;

      if (timeLeft < 0) {
        clearInterval(interval);
        timerElement.innerText = "Expired";
        document.getElementById("btn_resend").style.display = "block"

      }
    }, 1000);
  }
  startTimer();
  const inputs = document.querySelectorAll(".otp-inputs input");
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    })
  })

  document.getElementById("otpForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    let otp = "";
    inputs.forEach(input => otp += input.value);

    if (otp.length < 4) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "Please enter all digits"
      });
      return;
    }

    try {
      const response = await fetch("/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      })

      const data = await response.json()

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "OTP Verified Successfully",
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Invalid OTP"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong, please try again"
      });
    }
  });

  async function resendOTP() {
    clearInterval(interval);
    timeLeft = 60;
    timerElement.innerText = "01:00";
    startTimer();
    document.getElementById("btn_resend").style.display = "none"

    try {
      const response = await fetch("/resendOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json()

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "OTP Resent Successfully",
          showConfirmButton: false,
          timer: 1500
        });
        inputs.forEach(input => input.value = "");
        inputs[0].focus();
      } else {
        Swal.fire({
          icon: "error",
          title: "Something went wrong, please try again",
          text: `${data.message}`,
          showConfirmButton: false,
          timer: 1500
        })
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Could not resend OTP, please try again"
      })
    }
  }