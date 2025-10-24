/**
 * Kanban Board Component
 * Drag-and-drop visual pipeline for orders, quotes, deals
 */

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Stack,
  IconButton,
  Avatar,
  Tooltip,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: string;
  value?: number;
  dueDate?: string;
  assignee?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
  limit?: number;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove: (cardId: string, fromColumn: string, toColumn: string) => Promise<void>;
  onCardClick?: (card: KanbanCard) => void;
  onCardEdit?: (card: KanbanCard) => void;
  onCardDelete?: (cardId: string) => void;
}

const SortableCard: React.FC<{
  card: KanbanCard;
  onCardClick?: (card: KanbanCard) => void;
  onCardEdit?: (card: KanbanCard) => void;
  onCardDelete?: (cardId: string) => void;
}> = ({ card, onCardClick, onCardEdit, onCardDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1.5,
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ cursor: 'pointer', flex: 1 }}
            onClick={() => onCardClick?.(card)}
          >
            {card.title}
          </Typography>
          
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                onCardEdit?.(card);
                setAnchorEl(null);
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                onCardDelete?.(card.id);
                setAnchorEl(null);
              }}
              sx={{ color: 'error.main' }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>

        {card.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {card.description}
          </Typography>
        )}

        <Stack spacing={1}>
          {card.value && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MoneyIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="bold">
                ${card.value.toLocaleString()}
              </Typography>
            </Box>
          )}

          {card.dueDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {new Date(card.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {card.assignee && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {card.assignee}
              </Typography>
            </Box>
          )}

          {card.priority && (
            <Chip
              label={card.priority.toUpperCase()}
              size="small"
              color={getPriorityColor(card.priority)}
              sx={{ width: 'fit-content' }}
            />
          )}

          {card.tags && card.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {card.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const KanbanColumn: React.FC<{
  column: KanbanColumn;
  onCardClick?: (card: KanbanCard) => void;
  onCardEdit?: (card: KanbanCard) => void;
  onCardDelete?: (cardId: string) => void;
}> = ({ column, onCardClick, onCardEdit, onCardDelete }) => {
  const isOverLimit = column.limit && column.cards.length > column.limit;

  return (
    <Paper
      sx={{
        minWidth: 320,
        maxWidth: 320,
        p: 2,
        backgroundColor: column.color ? `${column.color}10` : 'background.paper',
        borderTop: 3,
        borderColor: column.color || 'primary.main',
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {column.title}
        </Typography>
        <Chip
          label={column.cards.length}
          size="small"
          color={isOverLimit ? 'error' : 'default'}
        />
      </Box>

      {column.limit && (
        <Typography variant="caption" color={isOverLimit ? 'error' : 'text.secondary'} sx={{ mb: 1, display: 'block' }}>
          Limit: {column.cards.length}/{column.limit}
        </Typography>
      )}

      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box sx={{ minHeight: 400 }}>
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onCardClick={onCardClick}
              onCardEdit={onCardEdit}
              onCardDelete={onCardDelete}
            />
          ))}
          
          {column.cards.length === 0 && (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                color: 'text.secondary',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">Drop cards here</Typography>
            </Box>
          )}
        </Box>
      </SortableContext>
    </Paper>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns: initialColumns,
  onCardMove,
  onCardClick,
  onCardEdit,
  onCardDelete,
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find source and destination columns
    let sourceColumn: KanbanColumn | undefined;
    let destColumn: KanbanColumn | undefined;
    let cardIndex = -1;

    columns.forEach((col) => {
      const index = col.cards.findIndex((card) => card.id === active.id);
      if (index !== -1) {
        sourceColumn = col;
        cardIndex = index;
      }
    });

    columns.forEach((col) => {
      const index = col.cards.findIndex((card) => card.id === over.id);
      if (index !== -1) {
        destColumn = col;
      }
      // Also check if dropping directly on column
      if (col.id === over.id) {
        destColumn = col;
      }
    });

    if (!sourceColumn) return;

    const card = sourceColumn.cards[cardIndex];

    // If moving within same column
    if (sourceColumn.id === destColumn?.id) {
      const oldIndex = sourceColumn.cards.findIndex((c) => c.id === active.id);
      const newIndex = sourceColumn.cards.findIndex((c) => c.id === over.id);

      if (oldIndex !== newIndex) {
        const newCards = arrayMove(sourceColumn.cards, oldIndex, newIndex);
        setColumns(
          columns.map((col) =>
            col.id === sourceColumn!.id ? { ...col, cards: newCards } : col
          )
        );
      }
    } 
    // Moving to different column
    else if (destColumn) {
      try {
        await onCardMove(String(active.id), sourceColumn.id, destColumn.id);

        const newSourceCards = sourceColumn.cards.filter((c) => c.id !== active.id);
        const updatedCard = { ...card, status: destColumn.id };
        const newDestCards = [...destColumn.cards, updatedCard];

        setColumns(
          columns.map((col) => {
            if (col.id === sourceColumn!.id) {
              return { ...col, cards: newSourceCards };
            }
            if (col.id === destColumn!.id) {
              return { ...col, cards: newDestCards };
            }
            return col;
          })
        );
      } catch (error) {
        console.error('Failed to move card:', error);
        // Optionally show error notification
      }
    }
  };

  // Update columns when initialColumns change
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 600,
        }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onCardClick={onCardClick}
            onCardEdit={onCardEdit}
            onCardDelete={onCardDelete}
          />
        ))}
      </Box>
    </DndContext>
  );
};

export default KanbanBoard;
