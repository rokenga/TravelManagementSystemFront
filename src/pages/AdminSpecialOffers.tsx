import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import ClientSpecificOffers from "../components/ClientSpecialOffers";
import PublishedOffers from "../components/PublicSpecialOffers";

const AdminSpecialOffers: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        centered // Center the tabs
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Klientams skirti pasiūlymai" />
        <Tab label="Viešai skelbiami pasiūlymai" />
      </Tabs>
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <ClientSpecificOffers />}
        {activeTab === 1 && <PublishedOffers />}
      </Box>
    </Box>
  );
};

export default AdminSpecialOffers;
