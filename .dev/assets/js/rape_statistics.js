        
        // Full chart without UK population, fixed DV data
        const ctx = document.getElementById('fullChart').getContext('2d');
        const fullChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
                datasets: [{
                    label: 'UK Net Migration (ONS, thousands)',
                    data: [185, 268, 267, 265, 273, 229, 229, 256, 205, 195, 244, 284, 303, 249, 208, 276, 184, 93, 484, 873, 850],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Reported Rapes England & Wales (ONS, thousands)',
                    data: [12.5, 13.0, 13.5, 14.0, 14.5, 15.0, 15.2, 15.5, 15.8, 16.0, 16.0, 22.0, 29.0, 35.0, 41.0, 54.0, 58.0, 52.0, 70.0, 68.9, 67.9],
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    tension: 0.4
                }, {
                    label: 'True Scale Annual (thousands)',
                    data: [79.9, 83.1, 86.3, 89.5, 92.7, 95.9, 97.2, 99.1, 101.0, 102.3, 102.6, 140.7, 185.4, 223.8, 262.1, 345.4, 370.9, 332.6, 447.5, 440.9, 434.4],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Cumulative Victims (millions)',
                    data: [0.16, 0.24, 0.33, 0.42, 0.51, 0.61, 0.70, 0.80, 0.90, 1.01, 1.11, 1.25, 1.43, 1.66, 1.92, 2.27, 2.64, 2.97, 3.42, 3.86, 4.29],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#d1d5db',
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(156, 163, 175, 0.2)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(156, 163, 175, 0.2)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 10
                            },
                            callback: function(value) {
                                return value + 'M';
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });