// Import tsParticles
const tsParticles = window.tsParticles;

class ParticleAnimation {
    constructor() {
        this.init();
    }

    
    async init() {
        await tsParticles.load("particle-container", {
            fpsLimit: 60,
            fullScreen: { enable: false },
            style: {
                position: "relative"
            },
            container: {
                width: "100%",
                height: "100%"
            },
            particles: {
                color: {
                    value: "#0000001a"
                },
                links: {
                    color: "#aaa",
                    distance: 150,
                    enable: true,
                    opacity: 0.5,
                    width: 2.5
                },
                collisions: {
                    enable: true
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "out"
                    },
                    random: false,
                    speed: 0.3,
                    straight: false
                },
                number: {
                    density: {
                        enable: true,
                        area: 800
                    },
                    value: 80
                },
                opacity: {
                    value: 0.8
                },
                shape: {
                    type: ["circle", "char"], // Use both circle and text particles
                    character: {
                    value: ["Approval", "Denied", "Pending", "Verification", "Dashboard",
                        "Logs", "Status", "Risk", "Loan Request", "EMI",
                        "Repayment", "Collateral", "Credit Score", "Overdue", "Disbursement",
                        "Customer Management", "Verified", "Secure", "User Data", "Access",
                    ], // Your text options
                    font: "Roboto",
                    style: "",
                    weight: "100",
                    fill: true
                    }
                },
                size: {
                    value: { min: 5, max: 25 }
                }
            },
            detectRetina: true
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParticleAnimation();
});
