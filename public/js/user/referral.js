 const input = document.getElementById('referralCode')
    const applyBtn = document.getElementById('applyBtn')
    const msgArea = document.getElementById('msgArea')

    async function handleApply() {
        const code = input.value.trim()
        
        
        if (!code) return showMsg('Please enter a code', false)
        if(code.length<10) return showMsg('Invaild referral code', false)

        
        applyBtn.disabled = true
        applyBtn.innerText = "..."

        try {
            const res = await fetch('/validate-referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralCode: code })
            })
            const data = await res.json()

            if (data.success) {
                showMsg('Success! Redirecting...', true);
                input.classList.add('border-green-500', 'text-green-600')
                setTimeout(() => window.location.href = '/login', 1000)
            } else {
                showMsg(data.message || 'Invalid Code', false)
                input.classList.add('border-red-500')
                applyBtn.disabled = false
                applyBtn.innerText = "Apply"
            }
        } catch (err) {
            console.error(err)
            showMsg('Server error. Try again.', false)
            applyBtn.disabled = false
            applyBtn.innerText = "Apply"
        }
    }

    function showMsg(text, isSuccess) {
        msgArea.innerText = text
        msgArea.className = `mt-3 text-sm text-center h-5 font-medium ${isSuccess ? 'text-green-600' : 'text-red-500'}`
        msgArea.classList.remove('opacity-0')
    }
    
    
    input.addEventListener('input', () => {
        msgArea.classList.add('opacity-0')
        input.classList.remove('border-red-500', 'border-green-500', 'text-green-600')
    })