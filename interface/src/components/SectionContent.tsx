import React from 'react';

import { Paper, Typography } from '@mui/material';

import { RequiredChildrenProps } from '../utils';

interface SectionContentProps extends RequiredChildrenProps {
  title: string;
  titleGutter?: boolean;
}

const SectionContent: React.FC<SectionContentProps> = (props) => {
  const { children, title, titleGutter } = props;
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, m: { xs: 1, sm: 2 } }}>
      <Typography variant="h6" gutterBottom={titleGutter}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
};

export default SectionContent;
