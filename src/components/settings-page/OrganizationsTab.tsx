import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building, Users, Trash2 } from "lucide-react";

import type { Entity, EntityType } from "@/hooks/account/useSettingsController";

type OrganizationsTabProps = {
  entities: Entity[];
  loading: boolean;
  creating: boolean;
  newEntityOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newEntityName: string;
  onEntityNameChange: (value: string) => void;
  newEntityType: EntityType;
  onEntityTypeChange: (value: EntityType) => void;
  newEntityDescription: string;
  onEntityDescriptionChange: (value: string) => void;
  onCreateEntity: () => void;
  onSetDefault: (id: string) => void;
  onDeleteEntity: (id: string) => void;
};

export function OrganizationsTab({
  entities,
  loading,
  creating,
  newEntityOpen,
  onOpenChange,
  newEntityName,
  onEntityNameChange,
  newEntityType,
  onEntityTypeChange,
  newEntityDescription,
  onEntityDescriptionChange,
  onCreateEntity,
  onSetDefault,
  onDeleteEntity,
}: OrganizationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Organisations et entités</h3>
          <p className="text-sm text-muted-foreground">
            Gérez vos entités personnelles et SCI
          </p>
        </div>

        <Dialog open={newEntityOpen} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle entité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle entité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="entity-name">Nom de l&apos;entité</Label>
                <Input
                  id="entity-name"
                  placeholder="Ex: SCI Investissement"
                  value={newEntityName}
                  onChange={(e) => onEntityNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-type">Type</Label>
                <Select
                  value={newEntityType}
                  onValueChange={(value: EntityType) => onEntityTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personnel</SelectItem>
                    <SelectItem value="SCI">SCI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-description">Description (optionnel)</Label>
                <Input
                  id="entity-description"
                  placeholder="Ex: Biens personnels"
                  value={newEntityDescription}
                  onChange={(e) => onEntityDescriptionChange(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={onCreateEntity} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {creating ? "Création..." : "Créer"}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : entities.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Aucune entité</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Créez votre première entité pour commencer à gérer vos biens
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entities.map((entity) => (
            <Card
              key={entity.id}
              className={entity.is_default ? "border-primary" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {entity.name}
                  </CardTitle>
                  {entity.is_default && (
                    <Badge variant="default" className="text-xs">
                      Entité principale
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  Type: {entity.type === "SCI" ? "SCI" : "Personnel"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {entity.description && (
                  <p className="text-sm text-muted-foreground">
                    {entity.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="font-medium">Biens</div>
                    <div className="text-lg font-semibold">
                      {entity.properties_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Propriétés rattachées
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="font-medium">Baux actifs</div>
                    <div className="text-lg font-semibold">
                      {entity.active_leases_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contrats en cours
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  {!entity.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetDefault(entity.id)}
                    >
                      Définir comme principale
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeleteEntity(entity.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
