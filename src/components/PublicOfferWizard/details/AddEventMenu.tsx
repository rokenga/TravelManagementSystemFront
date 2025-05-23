"use client"

import React, { useRef } from "react"
import { Box, Button, Menu, MenuItem, ListItemIcon } from "@mui/material"
import { DirectionsCar, Hotel, Sailing, ExpandMore, Image } from "@mui/icons-material"

interface AddEventMenuProps {
  onAddTransport: () => void
  onAddAccommodation: () => void
  onAddCruise: () => void
  onAddImages?: () => void
  hasImages?: boolean
}

const AddEventMenu: React.FC<AddEventMenuProps> = ({
  onAddTransport,
  onAddAccommodation,
  onAddCruise,
  onAddImages,
  hasImages = false,
}) => {
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (callback: () => void) => {
    callback()
    handleCloseMenu()
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Button
        variant="contained"
        onClick={handleOpenMenu}
        ref={addButtonRef}
        endIcon={<ExpandMore />}
        sx={{ minWidth: 200 }}
      >
        Pridėti įvykį
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick(onAddTransport)}>
          <ListItemIcon>
            <DirectionsCar fontSize="small" color="primary" />
          </ListItemIcon>
          Transportas
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick(onAddAccommodation)}>
          <ListItemIcon>
            <Hotel fontSize="small" color="primary" />
          </ListItemIcon>
          Apgyvendinimas
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick(onAddCruise)}>
          <ListItemIcon>
            <Sailing fontSize="small" color="primary" />
          </ListItemIcon>
          Kruizas
        </MenuItem>
        {onAddImages && (
          <MenuItem
            onClick={() => handleMenuItemClick(onAddImages)}
            disabled={hasImages}
            sx={{
              opacity: hasImages ? 0.5 : 1,
              pointerEvents: hasImages ? "none" : "auto",
            }}
          >
            <ListItemIcon>
              <Image fontSize="small" color={hasImages ? "disabled" : "primary"} />
            </ListItemIcon>
            Nuotraukos {hasImages ? "(jau pridėta)" : ""}
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}

export default AddEventMenu

