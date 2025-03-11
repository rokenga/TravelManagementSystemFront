"use client"

import type React from "react"
import { useRef } from "react"
import { Box, Button, Zoom, Paper, Stack, Fab, Menu, MenuItem, ListItemIcon } from "@mui/material"
import { Add as AddIcon, DirectionsCar, Hotel, LocalActivity, Sailing, ExpandMore } from "@mui/icons-material"

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
}) => {
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const handleOpenAddMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchorEl(event.currentTarget)
  }

  const handleCloseAddMenu = () => {
    setAddMenuAnchorEl(null)
    setAddMenuOpen(false)
  }

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
              <Button variant="outlined" startIcon={<DirectionsCar />} onClick={onAddTransport} size="small">
                Transportas
              </Button>
              <Button variant="outlined" startIcon={<Hotel />} onClick={onAddAccommodation} size="small">
                Nakvynė
              </Button>
              <Button variant="outlined" startIcon={<LocalActivity />} onClick={onAddActivity} size="small">
                Veikla
              </Button>
              <Button variant="outlined" startIcon={<Sailing />} onClick={onAddCruise} size="small">
                Kruizas
              </Button>
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
        <MenuItem onClick={onAddTransport}>
          <ListItemIcon>
            <DirectionsCar fontSize="small" />
          </ListItemIcon>
          Transportas
        </MenuItem>
        <MenuItem onClick={onAddAccommodation}>
          <ListItemIcon>
            <Hotel fontSize="small" />
          </ListItemIcon>
          Nakvynė
        </MenuItem>
        <MenuItem onClick={onAddActivity}>
          <ListItemIcon>
            <LocalActivity fontSize="small" />
          </ListItemIcon>
          Veikla
        </MenuItem>
        <MenuItem onClick={onAddCruise}>
          <ListItemIcon>
            <Sailing fontSize="small" />
          </ListItemIcon>
          Kruizas
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AddEventMenu

