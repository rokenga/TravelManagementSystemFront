"use client"

import type React from "react"
import { useRef } from "react"
import { Box, Button, Zoom, Paper, Stack, Fab, Menu, MenuItem, ListItemIcon, Tooltip } from "@mui/material"
import { Add as AddIcon, DirectionsCar, Hotel, LocalActivity, Sailing, ExpandMore, Image } from "@mui/icons-material"

interface AddEventMenuProps {
  isSmall: boolean
  addMenuOpen: boolean
  setAddMenuOpen: (open: boolean) => void
  addMenuAnchorEl: null | HTMLElement
  setAddMenuAnchorEl: (element: null | HTMLElement) => void
  onAddTransport: () => void
  onAddAccommodation: () => void
  onAddActivity: () => void
  onAddCruise: () => void
  onAddImages: () => void
  hasImageEvent: boolean
}

const AddEventMenu: React.FC<AddEventMenuProps> = ({
  isSmall,
  addMenuOpen,
  setAddMenuOpen,
  addMenuAnchorEl,
  setAddMenuAnchorEl,
  onAddTransport,
  onAddAccommodation,
  onAddActivity,
  onAddCruise,
  onAddImages,
  hasImageEvent,
}) => {
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const handleOpenAddMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchorEl(event.currentTarget)
  }

  const handleCloseAddMenu = () => {
    setAddMenuAnchorEl(null)
    setAddMenuOpen(false)
  }

  const handleMenuItemClick = (callback: () => void) => {
    callback()
    handleCloseAddMenu()
  }

  const imageDisabledMessage = "Ši diena jau turi nuotraukų pridėjimo elementą."

  if (isSmall) {
    return (
      <Box sx={{ position: "relative", mb: 2 }}>
        <Zoom in={addMenuOpen}>
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              mb: 1,
              p: 1,
              display: addMenuOpen ? "block" : "none",
              zIndex: 10,
            }}
          >
            <Stack spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DirectionsCar />}
                onClick={() => handleMenuItemClick(onAddTransport)}
                size="small"
              >
                Transportas
              </Button>
              <Button
                variant="outlined"
                startIcon={<Hotel />}
                onClick={() => handleMenuItemClick(onAddAccommodation)}
                size="small"
              >
                Apgyvendinimas
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocalActivity />}
                onClick={() => handleMenuItemClick(onAddActivity)}
                size="small"
              >
                Veikla
              </Button>
              <Button
                variant="outlined"
                startIcon={<Sailing />}
                onClick={() => handleMenuItemClick(onAddCruise)}
                size="small"
              >
                Kruizas
              </Button>
              <Tooltip title={hasImageEvent ? imageDisabledMessage : ""}>
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<Image />}
                    onClick={hasImageEvent ? undefined : () => handleMenuItemClick(onAddImages)}
                    size="small"
                    disabled={hasImageEvent}
                  >
                    Nuotraukos
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Paper>
        </Zoom>

        <Fab
          color="primary"
          size="medium"
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          sx={{ position: "absolute", right: 0, bottom: 0 }}
        >
          <AddIcon />
        </Fab>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Button
        variant="contained"
        onClick={handleOpenAddMenu}
        size="large"
        ref={addButtonRef}
        endIcon={<ExpandMore />}
        sx={{ minWidth: 200 }}
      >
        Pridėti įvykį
      </Button>
      <Menu
        anchorEl={addMenuAnchorEl}
        open={Boolean(addMenuAnchorEl)}
        onClose={handleCloseAddMenu}
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
        <MenuItem onClick={() => handleMenuItemClick(onAddActivity)}>
          <ListItemIcon>
            <LocalActivity fontSize="small" color="primary" />
          </ListItemIcon>
          Veikla
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick(onAddCruise)}>
          <ListItemIcon>
            <Sailing fontSize="small" color="primary" />
          </ListItemIcon>
          Kruizas
        </MenuItem>
        <Tooltip title={hasImageEvent ? imageDisabledMessage : ""}>
          <span style={{ width: "100%" }}>
            <MenuItem
              onClick={() => (hasImageEvent ? null : handleMenuItemClick(onAddImages))}
              disabled={hasImageEvent}
              style={{ opacity: hasImageEvent ? 0.5 : 1 }}
            >
              <ListItemIcon>
                <Image fontSize="small" color="primary" />
              </ListItemIcon>
              Nuotraukos
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>
    </Box>
  )
}

export default AddEventMenu

