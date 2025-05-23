import type React from "react"
import Logo from "./Logo"
import { Link } from "react-router-dom"

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: "auto",
        backgroundColor: "#e0f5ff",
        padding: "1.5rem 0",
        width: "100%",
        boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "0 1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ maxWidth: "300px" }}>
            <div style={{ height: "40px", marginBottom: "1rem" }}>
              <Logo />
            </div>
            <p style={{ fontSize: "14px", color: "#004784", margin: "0 0 0.25rem 0" }}>
              Jūsų patikimas kelionių partneris, teikiantis aukščiausios kokybės paslaugas nuo 1992 m.
            </p>
            <p style={{ fontSize: "14px", color: "#004784", margin: 0 }}>© 2025 Saitas. Visos teisės saugomos</p>
          </div>

          <div style={{ minWidth: "150px" }}>
            <h4 style={{ color: "#004784", margin: "0 0 0.5rem 0", fontSize: "16px" }}>Nuorodos</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>
                <Link
                  to="/login"
                  style={{
                    color: "#004784",
                    textDecoration: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Prisijungimas agentams
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
