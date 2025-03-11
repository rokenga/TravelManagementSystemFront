"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material"
import FilterMenu from "../components/FilterMenu"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import { FilterList } from "@mui/icons-material"

const PublicSpecialOffers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const offers = [
    { id: 1, name: "Poilsis Maldyvuose", category: "Poilsio", price: 2000 },
    { id: 2, name: "Žygis Alpėse", category: "Nuotykių", price: 1200 },
    { id: 3, name: "Prabangus kruizas", category: "Prabangos", price: 3000 },
  ]

  const filterSections = [
    {
      title: "Kategorija",
      options: [
        {
          type: "checkbox" as const,
          label: "Kategorijos",
          options: ["Poilsio", "Nuotykių", "Prabangos"],
        },
      ],
    },
  ]

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Viešai skelbiami pasiūlymai
        </Typography>

        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Ieškoti pasiūlymų..." />

        <Box
          sx={{
            mt: 2,
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            {isMobile && (
              <Button variant="outlined" startIcon={<FilterList />} onClick={() => setIsFilterDrawerOpen(true)}>
                Filtruoti
              </Button>
            )}
            <SortMenu
              options={["Populiariausi", "Naujausi pirmi", "Kaina didėjimo tvarka", "Kaina mažėjimo tvarka"]}
              onSort={() => {}}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex" }}>
          {!isMobile && (
            <FilterMenu
              sections={filterSections}
              onApplyFilters={() => {}}
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Grid container spacing={2}>
              {offers.map((offer) => (
                <Grid item xs={12} key={offer.id}>
                  <Card>
                    <CardActionArea>
                      <CardContent>
                        <Typography variant="h6">{offer.name}</Typography>
                        <Typography variant="body2">Kategorija: {offer.category}</Typography>
                        <Typography variant="body2">Kaina: €{offer.price}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>

      {isMobile && (
        <FilterMenu
          sections={filterSections}
          onApplyFilters={() => {}}
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
        />
      )}
    </Box>
  )
}

export default PublicSpecialOffers

