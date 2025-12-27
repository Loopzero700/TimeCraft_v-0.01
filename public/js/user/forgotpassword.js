 const form = document.getElementById("forgotForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value;

    try {
      const response = await fetch("/forgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        Swal.fire({
          icon: "error",
          title: data.message,
          showConfirmButton: true,
          timer: 5000,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href =data.redirectUrl;
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
      });
    }
  });