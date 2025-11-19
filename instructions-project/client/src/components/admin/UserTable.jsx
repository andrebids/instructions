import React from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { formatDate, getRoleColor, getRoleLabel } from '../../utils/userHelpers';

/**
 * Componente de tabela de usuários
 * @param {Object} props
 * @param {Array} props.users - Lista de usuários
 * @param {boolean} props.loading - Se está carregando
 * @param {string|null} props.error - Mensagem de erro
 * @param {Function} props.onEdit - Callback quando clica em editar
 * @param {Function} props.onRetry - Callback quando clica em retry
 * @param {Function} props.isCurrentUser - Função para verificar se é usuário atual
 */
export function UserTable({
  users,
  loading,
  error,
  onEdit,
  onRetry,
  isCurrentUser,
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
        <span className="ml-4">{t('pages.dashboard.adminUsers.status.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-danger mb-4">{error}</p>
            {onRetry && (
              <Button onPress={onRetry}>{t('common.retry')}</Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-default-500">
            {t('pages.dashboard.adminUsers.table.noUsersFound')}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <Table aria-label="Tabela de utilizadores">
          <TableHeader>
            <TableColumn>{t('pages.dashboard.adminUsers.table.image')}</TableColumn>
            <TableColumn>{t('pages.dashboard.adminUsers.table.name')}</TableColumn>
            <TableColumn>{t('pages.dashboard.adminUsers.table.email')}</TableColumn>
            <TableColumn>{t('pages.dashboard.adminUsers.table.role')}</TableColumn>
            <TableColumn>{t('pages.dashboard.adminUsers.table.createdAt')}</TableColumn>
            <TableColumn>{t('pages.dashboard.adminUsers.table.lastLogin')}</TableColumn>
            <TableColumn>{t('pages.dashboard.adminUsers.table.actions')}</TableColumn>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center">
                      <Icon icon="lucide:user" className="text-default-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span>{user.fullName}</span>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={getRoleColor(user.role)}
                    variant="flat"
                  >
                    {getRoleLabel(user.role, t)}
                  </Chip>
                </TableCell>
                <TableCell>
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  {formatDate(user.lastLogin)}
                </TableCell>
                <TableCell>
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => onEdit(user)}
                    isDisabled={isCurrentUser && isCurrentUser(user.id)}
                  >
                    <Icon icon="lucide:pencil" className="text-default-400" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}

