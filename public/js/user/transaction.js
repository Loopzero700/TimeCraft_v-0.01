let currentPage = 1
let limit = 6

document.addEventListener("DOMContentLoaded", () => {
    loadTransactions(currentPage)

    document.getElementById("prevBtn").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--
            loadTransactions(currentPage)
        }
    })

    document.getElementById("nextBtn").addEventListener("click", () => {
        currentPage++
        loadTransactions(currentPage)
    })
})


async function loadTransactions(page) {
    try {
        const res = await fetch(`/transaction/data?page=${page}&limit=${limit}`)
        const data = await res.json()

        renderTransactions(data.Data)
        updatePagination(data.pagination)

    } catch (err) {
        console.error("Error fetching wallet transactions:", err)
    }
}


function renderTransactions(list) {
    const ul = document.getElementById("walletList")
    ul.innerHTML = ""

    if (!list || list.length === 0) {
        ul.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">No transactions found</h3>
                <p class="text-gray-500 text-sm">Your history will appear here once you make a transaction.</p>
            </div>
        `;
        return
    }

    list.forEach(data => {
        const sign = data.type === "credit" ? "+" : "-";
        const color = data.type === "credit" ? "text-green-600" : "text-red-500";
        const badgeColor = data.type === "credit"
            ? "bg-green-100 text-green-700"
            : "bg-red-50 text-red-600";

        ul.innerHTML += `
            <li class="p-6 hover:bg-gray-50 transition-colors duration-200
                flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div class="flex flex-col space-y-1.5">
                    <div class="flex items-center gap-3">
                        <span class="${color} font-bold text-lg font-mono tracking-tight">
                            ${sign} ₹${data.amount}
                        </span>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase 
                            tracking-wider ${badgeColor}">
                            ${data.type}
                        </span>
                    </div>

                    <p class="text-gray-600 text-sm font-medium">${data.description}</p>
                </div>

                <div class="flex flex-row sm:flex-col items-center sm:items-end">
                    <span class="text-xs text-gray-400 font-medium uppercase tracking-wide sm:mb-1">Date</span>
                    <span class="text-gray-800 font-semibold text-sm">
                        ${new Date(data.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        })}
                    </span>
                </div>

            </li>
        `
    })
}


function updatePagination(p) {
    currentPage = p.currentPage
    document.getElementById("pageText").innerText =
        `Page ${p.currentPage} of ${p.totalPages}`

    document.getElementById("prevBtn").disabled = p.currentPage === 1
    document.getElementById("nextBtn").disabled = p.currentPage === p.totalPages
}