import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Plus } from "lucide-react";

import type { SettingsBankAccount } from "./types";

type BankingTabProps = {
  accounts: SettingsBankAccount[];
  formatDate: (value: string) => string;
};

export function BankingTab({ accounts, formatDate }: BankingTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Comptes bancaires</h3>
          <p className="text-sm text-muted-foreground">
            Connexion aux banques et agrégation
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Connecter un compte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connecter un compte bancaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Intégration bancaire en mode STUB pour la démonstration
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière synchro</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Aucun compte connecté pour le moment. Utilisez le bouton
                    &laquo; Connecter un compte &raquo; pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{account.iban}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {account.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-xs">
                        Connecté
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(account.lastSync)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Synchroniser
                        </Button>
                        <Button size="sm" variant="ghost">
                          Configurer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
