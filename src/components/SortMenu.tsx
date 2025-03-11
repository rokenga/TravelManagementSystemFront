import React from "react"
import { Button, Menu, MenuItem } from "@mui/material"
import { KeyboardArrowDown, Sort } from "@mui/icons-material"

interface SortMenuProps {
  options: string[]
  onSort: (option: string) => void
}

const SortMenu: React.FC<SortMenuProps> = ({ options, onSort }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleSortOptionClick = (option: string) => {
    onSort(option)
    handleCloseMenu()
  }

  return (
    <>
      <Button
        onClick={handleOpenMenu}
        endIcon={<KeyboardArrowDown />}
        startIcon={<Sort />}
        sx={{
          color: "#004784",
          textTransform: "none",
          fontSize: "14px",
          "&:hover": {
            backgroundColor: "rgba(0, 71, 132, 0.04)",
          },
        }}
      >
        Rikiuoti
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            minWidth: "150px",
            borderRadius: "8px",
            "& .MuiMenuItem-root": {
              fontSize: "14px",
              color: "#004784",
              padding: "8px 16px",
              "&:hover": {
                backgroundColor: "primary",
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={index}
            onClick={() => handleSortOptionClick(option)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default SortMenu

