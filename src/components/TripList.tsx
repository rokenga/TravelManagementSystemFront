import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";

const TripList = ({ trips, searchTerm }) => {
  const filteredTrips = trips.filter((trip) =>
    trip.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {filteredTrips.length ? (
        filteredTrips.map((trip) => (
          <Card
            key={trip.id}
            sx={{
              marginBottom: 2,
              padding: 1,
            }}
          >
            <CardContent>
              <Typography variant="h6">{trip.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                Data: {trip.date}
              </Typography>
              <Typography variant="body2">Kategorija: {trip.category}</Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography variant="body2">Nerasta kelionių.</Typography>
      )}
    </Box>
  );
};

export default TripList;
