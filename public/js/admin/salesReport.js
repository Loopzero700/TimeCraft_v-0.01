 let state = {
            page: 1,
            search: '',
            filterType: 'All',
            startDate: '',
            endDate: ''
        }

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons()
            fetchData()
            
            const searchInput = document.getElementById('searchInput')
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    state.search = e.target.value;
                    state.page = 1;
                    fetchData();
                }
            })

            
            const filterBtn = document.getElementById('filterBtn')
            const filterMenu = document.getElementById('filterMenu')

            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                filterMenu.classList.toggle('hidden')
            })

            document.addEventListener('click', (e) => {
                if (!filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
                    filterMenu.classList.add('hidden')
                }
            })
        })

    
        async function fetchData() {
            showLoader(true)
            try {
                const params = new URLSearchParams({
                    page: state.page,
                    search: state.search,
                    filterType: state.filterType,
                    startDate: state.startDate,
                    endDate: state.endDate
                })

                const response = await fetch(`/admin/sales-data?${params.toString()}`)
                const data = await response.json()

                if (data.error) throw new Error(data.error)

                updateStats(data.stats)
                renderTable(data.tableData)
                renderPagination(data.tableData.pagination)

            } catch (error) {
                console.error("Error fetching sales:", error)
                document.getElementById('tableBody').innerHTML = `<tr><td colspan="8" class="py-12 text-center text-red-500">Error loading data.</td></tr>`
            } finally {
                showLoader(false)
            }
        }

        function downloadReport(format) {
            const params = new URLSearchParams({
                filterType: state.filterType,
                startDate: state.startDate,
                endDate: state.endDate,
                search: state.search 
            })
            
            window.location.href = `/admin/sales-report/${format}?${params.toString()}`
        }

    
        function updateStats(stats) {
            document.getElementById('statTotalOrders').innerText = stats.totalOrders
            document.getElementById('statTotalRevenue').innerText = '₹ ' + stats.totalRevenue.toLocaleString('en-IN')
            document.getElementById('statTotalDiscount').innerText = '₹ ' + stats.totalDiscount.toLocaleString('en-IN')
        }

        function renderTable(tableData) {
            const tbody = document.getElementById('tableBody')
            tbody.innerHTML = ''

            if (tableData.results.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-gray-500">No sales found for this period.</td></tr>`
                return
            }

            tableData.results.forEach((row, index) => {
                const slNo = ((tableData.pagination.currentPage - 1) * tableData.pagination.limit) + index + 1
                const dateStr = new Date(row.createdAt).toLocaleDateString('en-GB')
                const discount = row.subtotal - row.total

                const tr = `
                    <tr class="group hover:bg-[#252525] transition-colors border-b border-[#252525] last:border-0">
                        <td class="py-5 px-4 text-sm text-white font-medium">${slNo}</td>
                        <td class="py-5 px-4 text-sm text-white font-semibold">
                            ${row.address_name || 'N/A'} <br>
                            <span class="text-xs text-gray-500 font-normal">${row.order_id}</span>
                        </td>
                        <td class="py-5 px-4 text-sm text-gray-400 max-w-[150px] truncate">
                            ${row.address_city || ''}, ${row.address_state || ''}
                        </td>
                        <td class="py-5 px-4 text-sm text-gray-300">${row.items ? row.items.length : 0}</td>
                        <td class="py-5 px-4 text-sm text-white">₹ ${row.total}</td>
                        <td class="py-5 px-4 text-sm text-[#FF7F50]">₹ ${discount}</td>
                        <td class="py-5 px-4 text-sm text-gray-300">
                            <span class="px-2 py-1 rounded bg-[#333] text-xs border border-[#444]">${row.payment_method}</span>
                        </td>
                        <td class="py-5 px-4 text-sm text-gray-400">${dateStr}</td>
                    </tr>
                `;
                tbody.innerHTML += tr;
            });
        }

        function renderPagination(pagination) {
            const container = document.getElementById('paginationContainer')
            container.innerHTML = ''

            if (pagination.totalPages <= 1) return

            const createButton = (page, label, isActive = false, isDisabled = false) => {
                const btn = document.createElement('button')
                btn.className = isActive 
                    ? 'w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-all bg-[#FF7F50] text-white shadow-lg shadow-orange-900/20'
                    : 'w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-all bg-[#252525] text-gray-400 hover:bg-[#333] border border-[#333]';
                
                if (label === 'Prev' || label === 'Next') {
                    btn.className = 'px-4 h-9 flex items-center justify-center rounded-md bg-[#252525] text-gray-400 text-sm font-medium hover:bg-[#333] border border-[#333] disabled:opacity-50';
                }

                btn.innerText = label
                if (isDisabled) btn.disabled = true
                
                if (!isDisabled && !isActive && label !== '...') {
                    btn.onclick = () => changePage(page)
                }
                return btn
            }

            container.appendChild(createButton(pagination.currentPage - 1, 'Prev', false, pagination.currentPage === 1))

            for (let i = 1; i <= pagination.totalPages; i++) {
                if (i === 1 || i === pagination.totalPages || (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
                    container.appendChild(createButton(i, i, i === pagination.currentPage));
                } else if ((i === pagination.currentPage - 2 && i > 1) || (i === pagination.currentPage + 2 && i < pagination.totalPages)) {
                    const span = document.createElement('span');
                    span.className = "text-gray-600";
                    span.innerText = "...";
                    container.appendChild(span);
                }
            }

            container.appendChild(createButton(pagination.currentPage + 1, 'Next', false, pagination.currentPage === pagination.totalPages));
        }

        function changePage(newPage) {
            state.page = newPage
            fetchData()
        }

        function setFilter(type, btnElement) {
            state.filterType = type
            state.startDate = ''
            state.endDate = ''
            state.page = 1
            
            document.getElementById('currentFilterLabel').innerText = type === 'All' ? 'All Time' : type
            
            document.querySelectorAll('.filter-option').forEach(btn => {
                btn.classList.remove('bg-[#FF7F50]', 'text-white')
                btn.classList.add('text-gray-400', 'hover:bg-[#252525]')
            })
            
            if(btnElement) {
                btnElement.classList.remove('text-gray-400', 'hover:bg-[#252525]')
                btnElement.classList.add('bg-[#FF7F50]', 'text-white')
            }

            document.getElementById('filterMenu').classList.add('hidden')
            fetchData()
        }

        function toggleCustomDate() {
             const container = document.getElementById('customDateInputs')
             container.classList.toggle('hidden')
        }

        function applyCustomFilter() {
            const start = document.getElementById('startDate').value
            const end = document.getElementById('endDate').value

            if (!start || !end) {
                alert("Please select both start and end dates.")
                return
            }

            state.filterType = 'Custom'
            state.startDate = start
            state.endDate = end
            state.page = 1
            
            document.getElementById('currentFilterLabel').innerText = 'Custom Range'
            document.getElementById('filterMenu').classList.add('hidden')
            
            document.querySelectorAll('.filter-option').forEach(btn => {
                btn.classList.remove('bg-[#FF7F50]', 'text-white')
                btn.classList.add('text-gray-400')
            })

            fetchData()
        }

        function showLoader(show) {
            const loader = document.getElementById('tableLoader')
            if(show) loader.classList.remove('hidden')
            else loader.classList.add('hidden')
        }