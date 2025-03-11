import React from "react";
import Logo from "./Logo";

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e0f5ff",
        padding: "1rem 0",
        width: "100%",
        boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Logo />
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "#004784",
          fontWeight: 400, // Optional: Adjust font weight as needed
        }}
      >
        © 2024 Saitas. Visos teisės saugomos
      </p>
    </footer>
  );
};

export default Footer;
