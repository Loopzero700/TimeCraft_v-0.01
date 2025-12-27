let salesChart

    async function fetchChartData(filterType) {
        try {
            const response = await fetch(`/admin/dashboard-chart?filter=${filterType}`)
            const data = await response.json()
            return data
        } catch (error) {
            console.error("Error fetching chart data:", error)
            return { labels: [], salesData: [] }
        }
    }

    async function initChart() {
        const ctx = document.getElementById('ordersChart').getContext('2d')
        
    
        const initialData = await fetchChartData('monthly')

        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialData.labels,
                datasets: [{
                    label: 'Orders',
                    data: initialData.salesData,
                    borderColor: '#ff7e5f',
                    backgroundColor: 'rgba(255, 126, 95, 0.15)', 
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#1c1c1c', 
                    pointBorderColor: '#ff7e5f',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#333',
                        titleColor: '#fff',
                        bodyColor: '#ccc',
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#888' },
                        grid: { color: '#333', drawBorder: false }
                    },
                    y: {
                        ticks: { color: '#888', stepSize: 1 },
                        grid: { color: '#333', borderDash: [5, 5] },
                        beginAtZero: true
                    }
                }
            }
        })
    }

    async function updateChart(filterType) {
        const newData = await fetchChartData(filterType)
        
        salesChart.data.labels = newData.labels
        salesChart.data.datasets[0].data = newData.salesData
        
        salesChart.update()
    }

    document.addEventListener('DOMContentLoaded', initChart)

 

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#333',
                titleColor: '#fff',
                bodyColor: '#ccc',
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#eee' } },
            x: { grid: { display: false } }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        
        if(topProductsData.length > 0) {
            const ctxProd = document.getElementById('productsChart').getContext('2d');
            new Chart(ctxProd, {
                type: 'bar',
                data: {
                    labels: topProductsData.map(p => p.name.substring(0, 15) + '...'), 
                    datasets: [{
                        label: 'Units Sold',
                        data: topProductsData.map(p => p.totalSold),
                        backgroundColor: '#ff7e5f',
                        borderRadius: 4
                    }]
                },
                options: {
                    ...commonOptions,
                    indexAxis: 'y', 
                }
            })
        }

        if(topCategoriesData.length > 0) {
            const ctxCat = document.getElementById('categoryChart').getContext('2d');
            new Chart(ctxCat, {
                type: 'doughnut',
                data: {
                    labels: topCategoriesData.map(c => c.name),
                    datasets: [{
                        data: topCategoriesData.map(c => c.totalSold),
                        backgroundColor: [
                            '#ff7e5f', '#feb47b', '#ff9f43', '#ee5253', '#10ac84'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'right',
                            labels: { boxWidth: 12 } 
                        }
                    }
                }
            })
        }


        if(topBrandsData.length > 0) {
            const ctxBrand = document.getElementById('brandsChart').getContext('2d');
            new Chart(ctxBrand, {
                type: 'bar',
                data: {
                    labels: topBrandsData.map(b => b.brand.brandName),
                    datasets: [{
                        label: 'Units Sold',
                        data: topBrandsData.map(b => b.totalSold),
                        backgroundColor: 'rgba(255, 126, 95, 0.6)',
                        borderColor: '#ff7e5f',
                        borderWidth: 1
                    }]
                },
                options: commonOptions
            })
        }
        initChart()
    })