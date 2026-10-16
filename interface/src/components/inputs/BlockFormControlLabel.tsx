import React, { FC } from "react";
import { Box, FormControlLabel, FormControlLabelProps } from "@mui/material";

const BlockFormControlLabel: FC<FormControlLabelProps> = (props) => (
  <Box sx={{ display: 'block', my: 1 }}>
    <FormControlLabel {...props} />
  </Box>
);

export default BlockFormControlLabel;
